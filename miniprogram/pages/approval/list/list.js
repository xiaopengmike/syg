// pages/approval/list/list.js
const app = getApp();
const { showLoading, hideLoading, showToast } = require('../../../utils/api');

Page({
  data: {
    list: [],
    totalCount: 0,
    isLoading: false
  },

  onLoad() {
    // 等待 app 初始化完成后检查登录状态
    app.onReady(() => {
      this._initPage();
    });
  },

  /**
   * 初始化页面
   */
  _initPage() {
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

    // 检查权限（只有校长可以访问）
    const userInfo = app.globalData.userInfo;
    if (userInfo.role !== 'principal') {
      wx.showModal({
        title: '提示',
        content: '只有校长可以审批学生注册',
        showCancel: false,
        success: () => {
          wx.navigateBack();
        }
      });
      return;
    }

    this.loadPendingList();
  },

  onShow() {
    app.onReady(() => {
      if (app.globalData.isLoggedIn) {
        this.loadPendingList();
      }
    });
  },

  /**
   * 加载待审批列表
   */
  async loadPendingList() {
    this.setData({ isLoading: true });

    try {
      const userInfo = app.globalData.userInfo;
      const currentUserId = userInfo?._id || userInfo?.userId;

      const result = await wx.cloud.callFunction({
        name: 'user',
        data: {
          action: 'pending',
          currentUserId
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
      console.error('加载待审批列表失败:', error);
      showToast('加载失败');
    } finally {
      this.setData({ isLoading: false });
    }
  },

  /**
   * 批准注册
   */
  async handleApprove(e) {
    const { id, name } = e.currentTarget.dataset;
    
    wx.showModal({
      title: '确认批准',
      content: `确定批准「${name}」的注册申请吗？`,
      success: async (res) => {
        if (res.confirm) {
          await this._doApprove(id, 'approve');
        }
      }
    });
  },

  /**
   * 拒绝注册
   */
  async handleReject(e) {
    const { id, name } = e.currentTarget.dataset;
    
    wx.showModal({
      title: '确认拒绝',
      content: `确定拒绝「${name}」的注册申请吗？`,
      success: async (res) => {
        if (res.confirm) {
          await this._doApprove(id, 'reject');
        }
      }
    });
  },

  /**
   * 执行审批操作
   */
  async _doApprove(targetUserId, action) {
    showLoading(action === 'approve' ? '批准中...' : '拒绝中...');

    try {
      const userInfo = app.globalData.userInfo;
      const currentUserId = userInfo?._id || userInfo?.userId;

      const result = await wx.cloud.callFunction({
        name: 'user',
        data: {
          action: 'approve',
          targetUserId,
          action: action,
          currentUserId
        }
      });

      hideLoading();

      if (result.result && result.result.success) {
        wx.showToast({
          title: action === 'approve' ? '已批准' : '已拒绝',
          icon: 'success'
        });
        // 刷新列表
        this.loadPendingList();
      } else {
        showToast(result.result?.message || '操作失败');
      }
    } catch (error) {
      hideLoading();
      console.error('审批操作失败:', error);
      showToast('操作失败');
    }
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadPendingList().then(() => {
      wx.stopPullDownRefresh();
    });
  }
});
