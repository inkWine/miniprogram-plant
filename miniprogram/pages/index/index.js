Page({
  data: {
    searchKey: '',
    categoryList: [
      { id: 'all', name: '全部' },
      { id: 'plant', name: '植物' },
      { id: 'insect', name: '昆虫' },
      { id: 'bird', name: '鸟类' },
      { id: 'sky', name: '天象' },
      { id: 'other', name: '其他' }
    ],
    currentCategory: 'all',
    observeList: [],
    loading: false,
    userLocation: {
      latitude: null,
      longitude: null
    }
  },

  onLoad() {
    // 页面加载先获取定位
    this.getUserLocation();
    // 加载观察列表
    this.loadObserveList();
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadObserveList(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 搜索输入实时同步
  onSearchInput(e) {
    this.setData({
      searchKey: e.detail.value
    });
  },

  // 点击键盘搜索按钮触发查询
  onSearch() {
    this.loadObserveList();
  },

  // 获取用户定位
  getUserLocation() {
    wx.getLocation({
      type: 'gcj02',
      altitude: false,
      success: (res) => {
        console.log('定位成功', res);
        this.setData({
          userLocation: {
            latitude: res.latitude,
            longitude: res.longitude
          }
        });
      },
      fail: (err) => {
        console.error('定位失败详情：', err);
        if (err.errMsg.includes('auth deny')) {
          this.showAuthModal();
        } else if (err.errMsg.includes('system permission')) {
          wx.showToast({
            title: '请开启手机系统定位',
            icon: 'none',
            duration: 2000
          });
        } else {
          wx.showToast({
            title: '定位失败，请检查网络',
            icon: 'none',
            duration: 2000
          });
        }
      }
    });
  },

  // 弹出权限引导弹窗
  showAuthModal() {
    wx.showModal({
      title: '需要定位权限',
      content: '获取位置后才能为你标记观察地点、展示同城内容',
      confirmText: '去开启',
      cancelText: '暂不开启',
      success: (res) => {
        if (res.confirm) {
          wx.openSetting({
            success: (settingRes) => {
              if (settingRes.authSetting['scope.userLocation']) {
                this.getUserLocation();
              }
            }
          });
        }
      }
    });
  },

  // 切换分类
  switchCategory(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ currentCategory: id });
    this.loadObserveList();
  },

  // 加载观察列表（支持分类筛选 + 关键词搜索）
  loadObserveList(callback) {
    const { currentCategory, searchKey } = this.data;
    this.setData({ loading: true });

    const db = wx.cloud.database();
    const _ = db.command;
    let query = db.collection('observe');

    // 分类筛选
    if (currentCategory !== 'all') {
      query = query.where({ category: currentCategory });
    }

    // 关键词模糊搜索（匹配物种名称，不区分大小写）
    if (searchKey.trim()) {
      query = query.where({
        speciesName: db.RegExp({
          regexp: searchKey.trim(),
          options: 'i'
        })
      });
    }

    query.orderBy('createTime', 'desc')
      .limit(20)
      .get()
      .then(res => {
        const list = res.data.map(item => ({
          ...item,
          nickname: item.nickname || '自然观察员',
          avatar: item.avatar || 'https://thirdwx.qlogo.cn/mmopen/vi_32/POgEwh4mIHO4nibH0KlMECNjjGxQUq24ZEaGT4poC6icRiccVGKSyXwibcPq4BWmiaIGuG1icwxaQX6grC9VemZoJ8rg/132'
        }));
        this.setData({
          observeList: list,
          loading: false
        });
      })
      .catch(err => {
        console.error('加载列表失败：', err);
        this.setData({ loading: false });
        wx.showToast({ title: '加载失败', icon: 'none' });
      })
      .finally(() => {
        callback && callback();
      });
  },

  // 跳转到发布页
  goPublish() {
    wx.navigateTo({
      url: '/pages/publish/publish'
    });
  }
});