const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { type } = event;

  try {
    // 初始化成就列表（首次运行时创建）
    const achievements = [
      { id: 'first_observe', name: '初识自然', desc: '发布第一条观察记录', icon: '🌱' },
      { id: 'ten_observe', name: '观察达人', desc: '累计发布10条观察', icon: '📸' },
      { id: 'seven_days', name: '七日坚持', desc: '连续观察7天', icon: '🔥' },
      { id: 'ten_species', name: '博物入门', desc: '发现10种不同物种', icon: '📚' }
    ];

    // 查询用户已有的成就
    const userAchRes = await db.collection('achievement')
      .where({ _openid: openid })
      .get();
    const userAchs = userAchRes.data;

    // 查询用户观察数据
    const observeRes = await db.collection('observe')
      .where({ _openid: openid })
      .get();
    const records = observeRes.data;

    // 检测解锁条件
    const toUnlock = [];
    const speciesSet = new Set(records.map(i => i.speciesName));

    // 第一条观察
    if (records.length >= 1) toUnlock.push('first_observe');
    // 10条观察
    if (records.length >= 10) toUnlock.push('ten_observe');
    // 10种物种
    if (speciesSet.size >= 10) toUnlock.push('ten_species');

    // 批量更新成就状态
    for (const achId of toUnlock) {
      const exist = userAchs.find(a => a.achievementId === achId);
      if (!exist) {
        const achInfo = achievements.find(a => a.id === achId);
        await db.collection('achievement').add({
          data: {
            _openid: openid,
            achievementId: achId,
            name: achInfo.name,
            desc: achInfo.desc,
            icon: achInfo.icon,
            unlocked: true,
            unlockTime: db.serverDate(),
            createTime: db.serverDate()
          }
        });
      }
    }

    return { code: 0, msg: '检测完成', unlocked: toUnlock };
  } catch (err) {
    console.error('成就检测失败：', err);
    return { code: -1, msg: '检测失败', error: err.message };
  }
};