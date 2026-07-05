const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;
const $ = db.command.aggregate;

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    // 1. 查询用户所有观察记录
    const observeRes = await db.collection('observe')
      .where({ _openid: openid })
      .get();
    const records = observeRes.data;

    // 2. 统计基础数据
    const totalCount = records.length;
    const speciesSet = new Set(records.map(i => i.speciesName));
    const speciesCount = speciesSet.size;

    // 3. 统计连续观察天数
    const dateSet = new Set(records.map(i => i.observeDate));
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

    // 4. 统计已解锁成就数
    const achievementRes = await db.collection('achievement')
      .where({ _openid: openid, unlocked: true })
      .count();

    return {
      code: 0,
      data: {
        totalCount,
        speciesCount,
        continuousDays,
        achievementCount: achievementRes.total
      }
    };
  } catch (err) {
    console.error('统计失败：', err);
    return { code: -1, msg: '统计失败', error: err.message };
  }
};