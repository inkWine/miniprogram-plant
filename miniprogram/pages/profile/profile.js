const db = wx.cloud.database();
const _ = db.command;

Page({
  data: {
    userInfo: {
      avatar: '',
      nickname: ''
    },
    yearStats: {
      total: 0,
      species: 0,
      favCategory: '-',
      maxMonth: '-'
    },
    monthData: []
  },

  onShow() {
    this.loadUserInfo();
    this.loadYearStats();
  },

  // 加载用户信息
  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo') || {};
    this.setData({ userInfo });
  },

  // 选择头像
  onChooseAvatar(e) {
    const avatarUrl = e.detail.avatarUrl;
    this.setData({
      'userInfo.avatar': avatarUrl
    });
    this.saveUserInfo();
  },

  // 输入昵称
  onNicknameInput(e) {
    const nickname = e.detail.value;
    this.setData({
      'userInfo.nickname': nickname
    });
    this.saveUserInfo();
  },

  // 保存用户信息到本地+云端
  saveUserInfo() {
    const { userInfo } = this.data;
    wx.setStorageSync('userInfo', userInfo);
    
    // 同步到云数据库user集合
    db.collection('user').where({
      _openid: '{openid}' // 云开发占位符，自动匹配当前用户
    }).get().then(res => {
      if (res.data.length > 0) {
        // 更新
        db.collection('user').doc(res.data[0]._id).update({
          data: {
            avatar: userInfo.avatar,
            nickname: userInfo.nickname,
            updateTime: db.serverDate()
          }
        });
      } else {
        // 新增
        db.collection('user').add({
          data: {
            avatar: userInfo.avatar,
            nickname: userInfo.nickname,
            createTime: db.serverDate()
          }
        });
      }
    });
  },

  // 加载年度统计数据
  loadYearStats() {
    const currentYear = new Date().getFullYear();
    const yearStart = `${currentYear}-01-01`;
    const yearEnd = `${currentYear}-12-31`;

    db.collection('observe')
      .where({
        observeDate: _.gte(yearStart).and(_.lte(yearEnd))
      })
      .get()
      .then(res => {
        const records = res.data;
        this.calcYearStats(records);
        this.calcMonthData(records);
      });
  },

  // 计算年度统计
  calcYearStats(records) {
    const total = records.length;
    const speciesSet = new Set(records.map(i => i.speciesName));
    
    // 统计分类频次
    const categoryMap = {};
    records.forEach(item => {
      const cat = item.categoryName || item.category;
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });
    let favCategory = '-';
    let maxCount = 0;
    for (const cat in categoryMap) {
      if (categoryMap[cat] > maxCount) {
        maxCount = categoryMap[cat];
        favCategory = cat;
      }
    }

    // 统计最多月份
    const monthMap = {};
    records.forEach(item => {
      const month = item.observeDate.split('-')[1];
      monthMap[month] = (monthMap[month] || 0) + 1;
    });
    let maxMonth = '-';
    let maxMonthCount = 0;
    for (const m in monthMap) {
      if (monthMap[m] > maxMonthCount) {
        maxMonthCount = monthMap[m];
        maxMonth = Number(m);
      }
    }

    this.setData({
      yearStats: {
        total,
        species: speciesSet.size,
        favCategory,
        maxMonth
      }
    });
  },

  // 计算月度柱状图数据
  calcMonthData(records) {
    const monthCount = {};
    for (let i = 1; i <= 12; i++) {
      monthCount[i] = 0;
    }

    records.forEach(item => {
      const month = Number(item.observeDate.split('-')[1]);
      monthCount[month]++;
    });

    const maxVal = Math.max(...Object.values(monthCount), 1);
    const monthData = [];
    for (let i = 1; i <= 12; i++) {
      monthData.push({
        month: i,
        height: Math.round((monthCount[i] / maxVal) * 100)
      });
    }

    this.setData({ monthData });
  },

  // 页面跳转
  goToPage(e) {
    const page = e.currentTarget.dataset.page;
    if (page === 'collection') {
      wx.switchTab({ url: '/pages/collection/collection' });
    } else if (page === 'calendar') {
      wx.switchTab({ url: '/pages/calendar/calendar' });
    }
  },

  // 关于弹窗
  showAbout() {
    wx.showModal({
      title: '关于物候志',
      content: '物候志 v1.0\n一款自然观察记录小程序\n记录身边的草木虫鱼，感受四季物候变化',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 清除缓存
  clearCache() {
    wx.showModal({
      title: '提示',
      content: '确定清除本地缓存吗？',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync();
          wx.showToast({ title: '缓存已清除', icon: 'success' });
        }
      }
    });
  }
});