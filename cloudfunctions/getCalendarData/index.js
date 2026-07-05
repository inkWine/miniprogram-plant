const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    const res = await db.collection('solar_term')
      .orderBy('date', 'asc')
      .get();
    
    return {
      code: 0,
      data: res.data
    };
  } catch (err) {
    console.error('获取节气数据失败：', err);
    return { code: -1, msg: '获取失败' };
  }
};