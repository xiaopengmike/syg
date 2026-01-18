// app.js
App({
  globalData: {
    userInfo: null,
    isLoggedIn: false,
    openid: null,
    ready: false  // 标记初始化完成
  },

  // 内部回调队列
  _readyCallbacks: [],

  onLaunch() {
    // 初始化云开发环境
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        // env 参数说明：
        //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.bindMethod）会默认请求到哪个云环境的资源
        //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
        //   如不填则使用默认环境（第一个创建的环境）
        env: 'cloudbase-9gjphcil0c9f4bff',
        traceUser: true
      });
    }

    // 尝试从本地存储恢复登录状态
    this.checkLoginStatus();

    // 标记初始化完成
    this.globalData.ready = true;

    // 通知等待的页面
    if (this._readyCallbacks && this._readyCallbacks.length > 0) {
      this._readyCallbacks.forEach(cb => cb());
      this._readyCallbacks = [];
    }
  },

  /**
   * 等待 app 初始化完成
   * @param {Function} callback 初始化完成后的回调
   */
  onReady(callback) {
    if (this.globalData.ready) {
      callback();
    } else {
      this._readyCallbacks = this._readyCallbacks || [];
      this._readyCallbacks.push(callback);
    }
  },

  /**
   * 检查登录状态
   */
  checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo');
    const token = wx.getStorageSync('token');
    
    if (userInfo && token) {
      this.globalData.userInfo = userInfo;
      this.globalData.isLoggedIn = true;
      this.globalData.openid = userInfo.openid;
    }
  },

  /**
   * 设置用户登录信息
   * @param {Object} userInfo 用户信息
   * @param {String} token 登录凭证
   */
  setLoginInfo(userInfo, token) {
    this.globalData.userInfo = userInfo;
    this.globalData.isLoggedIn = true;
    this.globalData.openid = userInfo.openid;
    
    wx.setStorageSync('userInfo', userInfo);
    wx.setStorageSync('token', token);
  },

  /**
   * 清除登录信息
   */
  clearLoginInfo() {
    this.globalData.userInfo = null;
    this.globalData.isLoggedIn = false;
    this.globalData.openid = null;
    
    wx.removeStorageSync('userInfo');
    wx.removeStorageSync('token');
  },

  /**
   * 获取用户角色
   * @returns {String|null} 用户角色
   */
  getUserRole() {
    return this.globalData.userInfo?.role || null;
  },

  /**
   * 检查是否是某个角色
   * @param {String} role 角色标识
   * @returns {Boolean}
   */
  isRole(role) {
    return this.globalData.userInfo?.role === role;
  }
});

