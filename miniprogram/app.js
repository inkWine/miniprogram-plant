// app.js
App({
  onLaunch: function () {
    // ⚠️ 请将 'your-env-id' 替换成你的真实云环境ID
    // 在开发者工具「云开发」控制台 -> 设置 -> 环境ID 中复制
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'test-d9gofs4emd4f85c09', // ← 这里改成你的环境ID，类似 'cloud1-xxxxxx'
        traceUser: true,
      });
      console.log('云开发初始化成功');
    }
  },
  globalData: {}
});