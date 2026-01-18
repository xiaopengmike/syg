// pages/users/list/list.js
const app = getApp();
const { showLoading, hideLoading, showToast } = require('../../../utils/api');

Page({
  data: {
    userType: 'student',  // teacher 或 student
    keyword: '',
    list: [],
    totalCount: 0,
    isLoading: false
  },

  onLoad(options) {
    // 保存 options 到实例变量，供 onReady 回调使用
    this._loadOptions = options;

    // 等待 app 初始化完成后检查登录状态
    app.onReady(() => {
      this._initPage(this._loadOptions);
    });
  },

  /**
   * 初始化页面（在 app 初始化完成后调用）
   */
  _initPage(options) {
    // 检查登录状态
    if (!app.globalData.isLoggedIn) {
      wx.showModal({
        title: '提示',
        content: '请先登录',
        showCancel: false,
        success: () => {
          wx.redirectTo({ url: '/pages/login/login' });
        }
      });
      return;
    }

    // 获取用户类型参数，默认为 student
    const userType = options.type || 'student';
    this.setData({ userType });

    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: userType === 'teacher' ? '我的老师' : '我的学生'
    });

    this.loadUsers();
  },

  onShow() {
    // 等待 app 初始化完成后检查登录状态
    app.onReady(() => {
      // 检查登录状态
      if (!app.globalData.isLoggedIn) {
        wx.redirectTo({ url: '/pages/login/login' });
        return;
      }
      // 每次显示时刷新列表
      this.loadUsers();
    });
  },

  /**
   * 搜索输入
   */
  onSearchInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  /**
   * 执行搜索
   */
  doSearch() {
    this.loadUsers();
  },

  /**
   * 清除搜索
   */
  clearSearch() {
    this.setData({ keyword: '' });
    this.loadUsers();
  },

  /**
   * 加载用户列表
   */
  async loadUsers() {
    this.setData({ isLoading: true });

    try {
      const userInfo = app.globalData.userInfo;
      const currentUserId = userInfo?._id || userInfo?.userId;

      const result = await wx.cloud.callFunction({
        name: 'user',
        data: {
          action: 'list',
          currentUserId, // 传递当前用户ID
          role: this.data.userType,
          keyword: this.data.keyword
        }
      });

      if (result.result && result.result.success) {
        const { list, totalCount } = result.result.data;
        this.setData({
          list,
          totalCount: totalCount || list.length
        });
      } else {
        showToast(result.result?.message || '加载失败');
      }
    } catch (error) {
      console.error('加载用户列表失败:', error);
      showToast('加载失败');
    } finally {
      this.setData({ isLoading: false });
    }
  },

  /**
   * 跳转到添加页
   */
  goToAdd() {
    wx.navigateTo({
      url: `/pages/users/add/add?role=${this.data.userType}`
    });
  },

  /**
   * 跳转到详情页
   */
  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/users/detail/detail?id=${id}`
    });
  },


  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadUsers().then(() => {
      wx.stopPullDownRefresh();
    });
  }
});




