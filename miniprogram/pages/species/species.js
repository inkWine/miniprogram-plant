const db = wx.cloud.database();

Page({
  data: {
    speciesName: '',
    speciesInfo: {},
    recordList: []
  },

  onLoad(options) {
    const name = decodeURIComponent(options.name);
    this.setData({ speciesName: name });
    this.loadSpeciesInfo();
    this.loadMyRecords();
  },

  // 加载物种基础信息
  loadSpeciesInfo() {
    const { speciesName } = this.data;
    // 先从本地基础库匹配，后续可对接云端物种库
    this.setData({
      speciesInfo: {
        name: speciesName,
        categoryName: '自然观察物种',
        image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600',
        desc: '该物种为常见自然观察对象，多出现于城市公园、郊野山林等环境。不同季节呈现不同的生长状态，是自然观察入门的经典记录对象。'
      }
    });
  },

  // 加载我对该物种的所有观察记录
  loadMyRecords() {
    const { speciesName } = this.data;

    db.collection('observe')
      .where({ speciesName })
      .orderBy('observeDate', 'desc')
      .get()
      .then(res => {
        this.setData({ recordList: res.data });
      })
      .catch(err => {
        console.error('加载观察记录失败：', err);
      });
  }
});