const db = wx.cloud.database();
const _ = db.command;

Page({
  data: {
    weekList: ['日', '一', '二', '三', '四', '五', '六'],
    currentYear: 2026,
    currentMonth: 7,
    dayList: [],
    currentTerm: {},
    currentSpecies: [],
    hasChecked: false
  },

  // 二十四节气完整数据
  termData: {
    'xiaohan': { name: '小寒', date: '01-05', desc: '冷气积久而寒，小寒是天气寒冷但还没有到极点的意思。', threeHou: ['雁北乡', '鹊始巢', '雉始雊'], species: ['蜡梅', '山茶'] },
    'dahan': { name: '大寒', date: '01-20', desc: '大寒是天气寒冷到极致的意思，是二十四节气中的最后一个节气。', threeHou: ['鸡始乳', '征鸟厉疾', '水泽腹坚'], species: ['水仙', '梅花'] },
    'lichun': { name: '立春', date: '02-04', desc: '立春为二十四节气之首，标志着万物闭藏的冬季已过去，开始进入风和日暖、万物生长的春季。', threeHou: ['东风解冻', '蛰虫始振', '鱼陟负冰'], species: ['迎春', '樱花'] },
    'yushui': { name: '雨水', date: '02-19', desc: '雨水节气标示着降雨开始，雨量渐增，气温回升、冰雪融化、降水增多。', threeHou: ['獭祭鱼', '鸿雁来', '草木萌动'], species: ['杏花', '蒲公英'] },
    'jingzhe': { name: '惊蛰', date: '03-06', desc: '惊蛰时节，春气萌动，春雷始鸣，惊醒蛰伏于地下越冬的蛰虫。', threeHou: ['桃始华', '仓庚鸣', '鹰化为鸠'], species: ['桃花', '蜜蜂'] },
    'chunfen': { name: '春分', date: '03-21', desc: '春分这天南北半球昼夜平分，此后太阳直射位置继续由赤道向北半球推移，北半球各地白昼开始长于黑夜。', threeHou: ['玄鸟至', '雷乃发声', '始电'], species: ['玉兰', '燕子'] },
    'qingming': { name: '清明', date: '04-05', desc: '清明时节气清景明，万物皆显，此时气温转暖，草木萌动，处处给人以清新明朗之感。', threeHou: ['桐始华', '田鼠化为鴽', '虹始见'], species: ['桐花', '柳絮'] },
    'guyu': { name: '谷雨', date: '04-20', desc: '谷雨是春季最后一个节气，取自雨生百谷之意，此时降水明显增加，秧苗初插、作物新种。', threeHou: ['萍始生', '鸣鸠拂其羽', '戴胜降于桑'], species: ['牡丹', '布谷鸟'] },
    'lixia': { name: '立夏', date: '05-06', desc: '立夏表示告别春天，是夏天的开始，万物至此皆长大，故名立夏也。', threeHou: ['蝼蝈鸣', '蚯蚓出', '王瓜生'], species: ['石榴花', '蝼蛄'] },
    'xiaoman': { name: '小满', date: '05-21', desc: '小满时节，北方麦类等夏熟作物籽粒开始饱满，但还未完全成熟，故称小满。', threeHou: ['苦菜秀', '靡草死', '麦秋至'], species: ['苦菜', '麦穗'] },
    'mangzhong': { name: '芒种', date: '06-06', desc: '芒种是种植农作物时机的分界点，这个时节气温显著升高、雨量充沛、空气湿度大。', threeHou: ['螳螂生', '鵙始鸣', '反舌无声'], species: ['螳螂', '荷花'] },
    'xiazhi': { name: '夏至', date: '06-21', desc: '夏至这天太阳直射地面的位置到达一年的最北端，北半球的白昼达到全年最长。', threeHou: ['鹿角解', '蝉始鸣', '半夏生'], species: ['蝉', '半夏'] },
    'xiaoshu': { name: '小暑', date: '07-07', desc: '小暑即为小热，意思是此时虽然已经能够感受到天气的炎热，但是并未达到一年内最热。', threeHou: ['温风至', '蟋蟀居宇', '鹰始鸷'], species: ['蟋蟀', '紫薇'] },
    'dashu': { name: '大暑', date: '07-23', desc: '大暑是一年中日照最多、最炎热的节气，湿热交蒸在此时到达顶点。', threeHou: ['腐草为萤', '土润溽暑', '大雨时行'], species: ['萤火虫', '睡莲'] },
    'liqiu': { name: '立秋', date: '08-08', desc: '立秋是秋季的第一个节气，为秋季的起点，进入立秋后，由夏季的多雨湿热过渡向秋季少雨干燥气候。', threeHou: ['凉风至', '白露生', '寒蝉鸣'], species: ['桂花', '寒蝉'] },
    'chushu': { name: '处暑', date: '08-23', desc: '处暑即为出暑，是炎热离开的意思，这时三伏已过或近尾声，初秋炎热将结束。', threeHou: ['鹰乃祭鸟', '天地始肃', '禾乃登'], species: ['向日葵', '稻穗'] },
    'bailu': { name: '白露', date: '09-08', desc: '白露是反映自然界寒气增长的重要节气，由于天气逐渐转凉，白昼有阳光尚热，但傍晚后气温便很快下降。', threeHou: ['鸿雁来', '玄鸟归', '群鸟养羞'], species: ['大雁', '芦苇'] },
    'qiufen': { name: '秋分', date: '09-23', desc: '秋分这天太阳几乎直射地球赤道，全球各地昼夜等长，秋分过后，太阳直射点继续由赤道向南半球推移。', threeHou: ['雷始收声', '蛰虫坯户', '水始涸'], species: ['菊花', '螃蟹'] },
    'hanlu': { name: '寒露', date: '10-08', desc: '寒露是深秋的节令，气温比白露时更低，地面的露水更冷，快要凝结成霜了。', threeHou: ['鸿雁来宾', '雀入大水为蛤', '菊有黄华'], species: ['秋菊', '枫叶'] },
    'shuangjiang': { name: '霜降', date: '10-24', desc: '霜降是秋季的最后一个节气，是秋季到冬季的过渡，由于霜是天冷、昼夜温差变化大的表现，故以霜降命名。', threeHou: ['豺乃祭兽', '草木黄落', '蜇虫咸俯'], species: ['柿子', '枯草'] },
    'lidong': { name: '立冬', date: '11-07', desc: '立冬是季节类节气，表示自此进入了冬季，意味着风雨、干湿、光照、气温等处于转折点上，开始从秋季向冬季气候过渡。', threeHou: ['水始冰', '地始冻', '雉入大水为蜃'], species: ['雪松', '寒号鸟'] },
    'xiaoxue': { name: '小雪', date: '11-22', desc: '小雪是反映降水与气温的节气，它是寒潮和强冷空气活动频数较高的节气，小雪节气的到来，意味着天气会越来越冷、降水量渐增。', threeHou: ['虹藏不见', '天气上升', '闭塞成冬'], species: ['山茶', '竹'] },
    'daxue': { name: '大雪', date: '12-07', desc: '大雪节气是干支历子月的起始，标志着仲冬时节正式开始，大雪节气与小雪节气一样，是反映气温与降水变化趋势的节气。', threeHou: ['鹖鴠不鸣', '虎始交', '荔挺出'], species: ['腊梅', '松'] },
    'dongzhi': { name: '冬至', date: '12-22', desc: '冬至这天太阳直射南回归线，太阳光对北半球最为倾斜，太阳高度角最小，是北半球各地白昼最短、黑夜最长的一天。', threeHou: ['蚯蚓结', '麋角解', '水泉动'], species: ['水仙', '冬青'] }
  },

  // 物种图片映射（使用本地占位图）
  speciesImages: {
    '蜡梅': '/images/placeholder-plant.jpg',
    '梅花': '/images/placeholder-plant.jpg',
    '迎春': '/images/placeholder-plant.jpg',
    '桃花': '/images/placeholder-plant.jpg',
    '荷花': '/images/placeholder-plant.jpg',
    '桂花': '/images/placeholder-plant.jpg',
    '菊花': '/images/placeholder-plant.jpg',
    '水仙': '/images/placeholder-plant.jpg'
  },

  onLoad() {
    const now = new Date();
    this.setData({
      currentYear: now.getFullYear(),
      currentMonth: now.getMonth() + 1
    });
    this.generateCalendar();
    this.getCurrentTerm();
    this.checkTodayStatus();
  },

  // 生成月历数据
  generateCalendar() {
    const { currentYear, currentMonth } = this.data;
    const firstDay = new Date(currentYear, currentMonth - 1, 1);
    const lastDay = new Date(currentYear, currentMonth, 0);
    const firstDayWeek = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const dayList = [];
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${today.getMonth()+1}-${today.getDate()}`;

    // 上月末尾日期补齐
    const prevMonthLast = new Date(currentYear, currentMonth - 1, 0).getDate();
    for (let i = firstDayWeek - 1; i >= 0; i--) {
      dayList.push({
        day: prevMonthLast - i,
        isCurrentMonth: false,
        isTerm: false
      });
    }

    // 当月日期
    for (let i = 1; i <= totalDays; i++) {
      const dateStr = `${currentYear}-${String(currentMonth).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
      const termInfo = this.getTermByDate(currentMonth, i);
      dayList.push({
        day: i,
        date: dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isTerm: !!termInfo,
        termName: termInfo ? termInfo.name : ''
      });
    }

    // 下月开头补齐
    const remain = 42 - dayList.length;
    for (let i = 1; i <= remain; i++) {
      dayList.push({
        day: i,
        isCurrentMonth: false,
        isTerm: false
      });
    }

    this.setData({ dayList });
  },

  // 根据日期获取对应节气
  getTermByDate(month, day) {
    const dateStr = `${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    for (const key in this.termData) {
      if (this.termData[key].date === dateStr) {
        return this.termData[key];
      }
    }
    return null;
  },

  // 获取当前所处节气
  getCurrentTerm() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const termKeys = Object.keys(this.termData);
    
    let currentTerm = this.termData[termKeys[termKeys.length - 1]];
    for (let i = 0; i < termKeys.length; i++) {
      const term = this.termData[termKeys[i]];
      const [tMonth, tDay] = term.date.split('-').map(Number);
      if (month > tMonth || (month === tMonth && day >= tDay)) {
        currentTerm = term;
      } else {
        break;
      }
    }

    // 组装对应物种
    const species = currentTerm.species.map(name => ({
      name,
      desc: `${currentTerm.name}时节常见物候`,
      image: this.speciesImages[name] || 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300'
    }));

    this.setData({
      currentTerm,
      currentSpecies: species
    });
  },

  // 上一月
  prevMonth() {
    let { currentYear, currentMonth } = this.data;
    currentMonth--;
    if (currentMonth < 1) {
      currentMonth = 12;
      currentYear--;
    }
    this.setData({ currentYear, currentMonth });
    this.generateCalendar();
  },

  // 下一月
  nextMonth() {
    let { currentYear, currentMonth } = this.data;
    currentMonth++;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear++;
    }
    this.setData({ currentYear, currentMonth });
    this.generateCalendar();
  },

  // 点击日期
  clickDay(e) {
    const day = e.currentTarget.dataset.day;
    if (!day.isCurrentMonth || !day.isTerm) return;
    wx.showToast({
      title: day.termName,
      icon: 'none'
    });
  },

  // 检查今日是否已打卡
  checkTodayStatus() {
    const today = this.formatDate(new Date());
    db.collection('user_observe')
      .where({
        date: today,
        type: 'term_check'
      })
      .get()
      .then(res => {
        this.setData({ hasChecked: res.data.length > 0 });
      });
  },

  // 格式化日期
  formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  // 打卡
  checkIn() {
    if (this.data.hasChecked) return;
    
    wx.showLoading({ title: '打卡中...', mask: true });
    const today = this.formatDate(new Date());
    const { currentTerm } = this.data;

    db.collection('user_observe').add({
      data: {
        type: 'term_check',
        termName: currentTerm.name,
        date: today,
        createTime: db.serverDate()
      }
    }).then(() => {
      wx.hideLoading();
      wx.showToast({ title: '打卡成功', icon: 'success' });
      this.setData({ hasChecked: true });
    }).catch(err => {
      wx.hideLoading();
      console.error('打卡失败：', err);
      wx.showToast({ title: '打卡失败', icon: 'none' });
    });
  }
});