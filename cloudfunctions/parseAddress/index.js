// cloudfunctions/parseAddress/index.js
const https = require('https');

/**
 * 使用 Node.js 内置 https 模块发送请求（零依赖）
 * @param {string} url 完整的请求地址
 * @param {object} options 可选，可添加 headers、method、body 等
 * @returns {Promise<object>} 解析后的 JSON 对象
 */
function httpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const { method = 'GET', headers = {}, body } = options;
    const urlObj = new URL(url);

    const requestOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data); // 非 JSON 时直接返回文本
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

/**
 * 云函数入口
 * @param {object} event 调用时传入的参数，如 { address: 'xx' }
 * @param {object} context
 * @returns {object}
 */
exports.main = async (event, context) => {
  const { address } = event;
  if (!address) {
    return { success: false, message: '缺少地址参数' };
  }

  try {
    // ---------- 这里替换成你自己的 API ----------
    // 假设使用腾讯位置服务的“地址解析”接口
    // 请到 https://lbs.qq.com/ 创建应用，获取 key
    const KEY = '5GXBZ-YJT6A-RVRKF-C4EOA-RWDF7-KRF6H'; // ⚠️ 务必替换
    const apiUrl = `https://apis.map.qq.com/ws/geocoder/v1/?address=${encodeURIComponent(address)}&key=${KEY}`;

    const result = await httpRequest(apiUrl);
    // 返回解析后的坐标和地址信息
    return {
      success: true,
      data: result,
    };
    // ---------- 接口替换结束 ----------
  } catch (err) {
    return {
      success: false,
      message: err.message || '网络错误',
    };
  }
};