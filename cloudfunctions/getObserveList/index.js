const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { category = 'all', page = 1, pageSize = 20 } = event;
  const wxContext = cloud.getWXContext();

  try {
    // 构建查询条件
    let query = db.collection('observe');
    if (category !== 'all') {
      query = query.where({ category });
    }

    // 分页查询
    const res = await query
      .orderBy('createTime', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get();

    // 补充用户信息（后续可对接user表）
    const list = res.data.map(item => ({
      ...item,
      nickname: item.nickname || '自然观察员',
      avatar: item.avatar || 'https://thirdwx.qlogo.cn/mmopen/vi_32/POgEwh4mIHO4nibH0KlMECNjjGxQUq24ZEaGT4poC6icRiccVGKSyXwibcPq4BWmiaIGuG1icwxaQX6grC9VemZoJ8rg/132'
    }));

    return {
      code: 0,
      msg: 'success',
      data: list,
      hasMore: list.length === pageSize
    };
  } catch (err) {
    console.error('获取观察列表失败：', err);
    return {
      code: -1,
      msg: '获取失败',
      error: err.message
    };
  }
};