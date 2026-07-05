const db = wx.cloud.database();
const _ = db.command;

Page({
  data: {
    categoryList: [
      { id: 'all', name: '全部' },
      { id: 'plant', name: '植物' },
      { id: 'insect', name: '昆虫' },
      { id: 'bird', name: '鸟类' },
      { id: 'sky', name: '天象' },
      { id: 'other', name: '其他' }
    ],
    currentCategory: 'all',
    stats: {
      speciesCount: 0,
      observeCount: 0,
      continuousDays: 0,
      achievementCount: 0
    },
    speciesList: [],
    loading: false
  },

  // 内置常见物种库（待发现图鉴）
  baseSpeciesLib: {
    plant: [
      { name: '绣球花', image: '/images/placeholder-plant.jpg' },
      { name: '荷花', image: '/images/placeholder-plant.jpg' },
      { name: '桂花', image: '/images/placeholder-plant.jpg' },
      { name: '菊花', image: '/images/placeholder-plant.jpg' },
      { name: '桃花', image: '/images/placeholder-plant.jpg' },
      { name: '梅花', image: '/images/placeholder-plant.jpg' }
    ],
    insect: [
      { name: '菜粉蝶', image: '/images/placeholder-insect.jpg' },
      { name: '蜜蜂', image: '/images/placeholder-insect.jpg' },
      { name: '螳螂', image: '/images/placeholder-insect.jpg' },
      { name: '蜻蜓', image: '/images/placeholder-insect.jpg' }
    ],
    bird: [
      { name: '麻雀', image: '/images/placeholder-bird.jpg' },
      { name: '燕子', image: '/images/placeholder-bird.jpg' },
      { name: '大雁', image: '/images/placeholder-bird.jpg' }
    ],
    sky: [
      { name: '彩虹', image: '/images/placeholder-sky.jpg' },
      { name: '晚霞', image: '/images/placeholder-sky.jpg' },
      { name: '星空', image: '/images/placeholder-sky.jpg' }
    ],
    other: [
      { name: '蘑菇', image: '/images/placeholder-other.jpg' },
      { name: '苔藓', image: '/images/placeholder-other.jpg' }
    ]
  },

  onShow() {
    this.loadUserObserveData();
    this.loadAchievementCount();
  },

  // 加载用户观察数据并统计
  loadUserObserveData() {
    this.setData({ loading: true });

    db.collection('observe')
      .orderBy('createTime', 'desc')
      .get()
      .then(res => {
        const records = res.data;
        this.calculateStats(records);
        this.generateSpeciesList(records);
      })
      .catch(err => {
        console.error('加载观察数据失败：', err);
      })
      .finally(() => {
        this.setData({ loading: false });
      });
  },

  // 计算统计数据
  calculateStats(records) {
    // 观察总次数
    const observeCount = records.length;

    // 物种数量（去重）
    const speciesSet = new Set(records.map(item => item.speciesName));
    const speciesCount = speciesSet.size;

    // 连续观察天数
    const dateSet = new Set(records.map(item => item.observeDate));
    const dateList = Array.from(dateSet).sort();
    let continuousDays = 0;
    if (dateList.length > 0) {
      let max = 1;
      let current = 1;
      for (let i = 1; i < dateList.length; i++) {
        const prev = new Date(dateList[i-1]);
        const curr = new Date(dateList[i]);
        const diff = (curr - prev) / (1000 * 60 * 60 * 24);
        if (diff === 1) {
          current++;
          max = Math.max(max, current);
        } else {
          current = 1;
        }
      }
      continuousDays = max;
    }

    this.setData({
      'stats.observeCount': observeCount,
      'stats.speciesCount': speciesCount,
      'stats.continuousDays': continuousDays
    });
  },

  // 生成图鉴列表
  generateSpeciesList(records) {
    const { currentCategory } = this.data;
    
    // 收集用户已发现的物种
    const discoveredMap = {};
    records.forEach(item => {
      const name = item.speciesName;
      if (!discoveredMap[name]) {
        discoveredMap[name] = {
          name,
          count: 1,
          category: item.category,
          image: item.coverImage,
          discovered: true
        };
      } else {
        discoveredMap[name].count++;
      }
    });

    // 合并基础物种库（待发现）
    let allSpecies = [];
    const categories = currentCategory === 'all' 
      ? Object.keys(this.baseSpeciesLib) 
      : [currentCategory];

    categories.forEach(cat => {
      const lib = this.baseSpeciesLib[cat] || [];
      lib.forEach(item => {
        if (!discoveredMap[item.name]) {
          allSpecies.push({
            ...item,
            category: cat,
            count: 0,
            discovered: false
          });
        }
      });
    });

    // 已发现物种加入列表
    const discoveredList = Object.values(discoveredMap);
    if (currentCategory !== 'all') {
      allSpecies = allSpecies.filter(item => item.category === currentCategory);
      const filteredDiscovered = discoveredList.filter(item => item.category === currentCategory);
      allSpecies = [...filteredDiscovered, ...allSpecies];
    } else {
      allSpecies = [...discoveredList, ...allSpecies];
    }

    this.setData({ speciesList: allSpecies });
  },

  // 切换分类
  switchCategory(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ currentCategory: id });
    this.loadUserObserveData();
  },

// 跳转物种详情
  goSpeciesDetail(e) {
  const name = e.currentTarget.dataset.name;
  wx.navigateTo({
    url: `/pages/species/species?name=${encodeURIComponent(name)}`
  });
},

  // 加载已解锁成就数量
  loadAchievementCount() {
    db.collection('achievement')
      .where({ unlocked: true })
      .count()
      .then(res => {
        this.setData({
          'stats.achievementCount': res.total
        });
      })
      .catch(() => {});
  }
});