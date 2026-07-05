const db = wx.cloud.database();

Page({
  data: {
    imageList: [], // 临时图片路径
    categoryOptions: [
      { id: 'plant', name: '植物' },
      { id: 'insect', name: '昆虫' },
      { id: 'bird', name: '鸟类' },
      { id: 'sky', name: '天象' },
      { id: 'other', name: '其他' }
    ],
    formData: {
      speciesName: '',
      categoryIndex: 0,
      location: '',
      observeDate: '',
      description: '',
      latitude: null,
      longitude: null
    },
    submitting: false
  },

  onLoad() {
    // 初始化默认日期为今天
    const today = this.formatDate(new Date());
    this.setData({
      'formData.observeDate': today
    });
    // 进入页面自动获取定位
    this.getCurrentLocation();
  },

  // 格式化日期 YYYY-MM-DD
  formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  // 选择图片
  chooseImage() {
    const remain = 9 - this.data.imageList.length;
    wx.chooseMedia({
      count: remain,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFiles = res.tempFiles.map(item => item.tempFilePath);
        this.setData({
          imageList: [...this.data.imageList, ...tempFiles]
        });
      }
    });
  },

  // 删除图片
  deleteImage(e) {
    const index = e.currentTarget.dataset.index;
    const list = [...this.data.imageList];
    list.splice(index, 1);
    this.setData({ imageList: list });
  },

  // 表单输入
  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`formData.${field}`]: e.detail.value
    });
  },

  // 分类选择
  onCategoryChange(e) {
    this.setData({
      'formData.categoryIndex': e.detail.value
    });
  },

  // 日期选择
  onDateChange(e) {
    this.setData({
      'formData.observeDate': e.detail.value
    });
  },

  // 获取当前定位
  getCurrentLocation() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.setData({
          'formData.latitude': res.latitude,
          'formData.longitude': res.longitude,
          'formData.location': `经度${res.longitude.toFixed(4)}, 纬度${res.latitude.toFixed(4)}`
        });
      },
      fail: () => {
        wx.showToast({ title: '定位失败，可手动填写', icon: 'none' });
      }
    });
  },

  // 提交发布
  async submitPublish() {
    const { imageList, formData, categoryOptions } = this.data;

    // 表单校验
    if (!formData.speciesName.trim()) {
      wx.showToast({ title: '请输入物种名称', icon: 'none' });
      return;
    }
    if (imageList.length === 0) {
      wx.showToast({ title: '请至少上传一张图片', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    wx.showLoading({ title: '发布中...', mask: true });

    try {
      // 1. 批量上传图片到云存储
      const uploadPromises = imageList.map((tempPath, index) => {
        const suffix = tempPath.split('.').pop();
        const cloudPath = `observe/${Date.now()}_${index}.${suffix}`;
        return wx.cloud.uploadFile({
          cloudPath,
          filePath: tempPath
        });
      });
      const uploadResults = await Promise.all(uploadPromises);
      const fileIds = uploadResults.map(item => item.fileID);

      // 2. 数据写入云数据库
      const category = categoryOptions[formData.categoryIndex];
      await db.collection('observe').add({
        data: {
          speciesName: formData.speciesName.trim(),
          category: category.id,
          categoryName: category.name,
          location: formData.location,
          latitude: formData.latitude,
          longitude: formData.longitude,
          observeDate: formData.observeDate,
          description: formData.description.trim(),
          images: fileIds,
          coverImage: fileIds[0], // 第一张作为封面
          likeCount: 0,
          commentCount: 0,
          createTime: db.serverDate()
        }
      });

      wx.hideLoading();
      wx.showToast({ title: '发布成功', icon: 'success' });

      // 3. 返回上一页并刷新
      setTimeout(() => {
        const pages = getCurrentPages();
        const prevPage = pages[pages.length - 2];
        if (prevPage && prevPage.loadObserveList) {
          prevPage.loadObserveList();
        }
        wx.navigateBack();
      }, 1500);

    } catch (err) {
      console.error('发布失败：', err);
      wx.hideLoading();
      wx.showToast({ title: '发布失败，请重试', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  }
});