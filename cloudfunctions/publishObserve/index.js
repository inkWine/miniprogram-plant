const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { speciesName, category, categoryName, location, latitude, longitude, observeDate, description, images, coverImage } = event;

  // 参数校验
  if (!speciesName || !speciesName.trim()) {
    return { code: -1, msg: '物种名称不能为空' };
  }
  if (!images || !Array.isArray(images) || images.length === 0) {
    return { code: -1, msg: '请至少上传一张图片' };
  }
  if (!category) {
    return { code: -1, msg: '请选择物种分类' };
  }

  try {
    // 写入数据库
    const res = await db.collection('observe').add({
      data: {
        _openid: wxContext.OPENID,
        speciesName: speciesName.trim(),
        category,
        categoryName,
        location: location || '',
        latitude: latitude || null,
        longitude: longitude || null,
        observeDate,
        description: description || '',
        images,
        coverImage: coverImage || images[0],
        likeCount: 0,
        commentCount: 0,
        createTime: db.serverDate()
      }
    });

    // 触发成就检测（调用另一个云函数）
    await cloud.callFunction({
      name: 'checkAchievement',
      data: { type: 'publish_observe' }
    });

    return {
      code: 0,
      msg: '发布成功',
      _id: res._id
    };
  } catch (err) {
    console.error('发布失败：', err);
    return {
      code: -1,
      msg: '发布失败',
      error: err.message
    };
  }
};