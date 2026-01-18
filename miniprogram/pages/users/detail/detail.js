// pages/users/detail/detail.js
const app = getApp();
const { showLoading, hideLoading, showToast, showError, showConfirm } = require('../../../utils/api');

Page({
  data: {
    userId: '',
    user: null,
    inviteInfo: null,
    isLoading: true
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

    const { id } = options;
    if (id) {
      this.setData({ userId: id });
      this.loadUserDetail(id);
    } else {
      showToast('参数错误');
      wx.navigateBack();
    }
  },

  /**
   * 加载用户详情
   */
  async loadUserDetail(userId) {
    this.setData({ isLoading: true });

    try {
      const userInfo = app.globalData.userInfo;
      const currentUserId = userInfo?._id || userInfo?.userId;

      const result = await wx.cloud.callFunction({
        name: 'user',
        data: {
          action: 'detail',
          currentUserId, // 传递当前用户ID
          userId
        }
      });

      if (result.result && result.result.success) {
        const { user, inviteInfo } = result.result.data;
        
        // 格式化时间
        if (user.createdAt) {
          user.createdAtStr = this.formatDate(user.createdAt);
        }
        if (inviteInfo && inviteInfo.expireTime) {
          inviteInfo.expireTimeStr = this.formatDate(inviteInfo.expireTime);
        }

        this.setData({ user, inviteInfo });
        
        // 更新导航栏标题
        wx.setNavigationBarTitle({
          title: user.name
        });
      } else {
        showToast(result.result?.message || '加载失败');
      }
    } catch (error) {
      console.error('加载用户详情失败:', error);
      showError('加载失败');
    } finally {
      this.setData({ isLoading: false });
    }
  },

  /**
   * 格式化日期
   */
  formatDate(dateStr) {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${minute}`;
  },

  /**
   * 生成邀请码（异步）
   */
  async generateInvite() {
    const { user } = this.data;
    const userInfo = app.globalData.userInfo;
    const currentUserId = userInfo?._id || userInfo?.userId;

    const result = await wx.cloud.callFunction({
      name: 'user',
      data: {
        action: 'invite',
        currentUserId, // 传递当前用户ID
        targetUserId: user._id
      }
    });

    if (result.result && result.result.success) {
      const { code, expireTime } = result.result.data;
      
      // 更新页面状态
      this.setData({
        inviteInfo: {
          code,
          expireTime,
          expireTimeStr: this.formatDate(expireTime),
          status: 'pending'
        },
        'user.bindStatus': 'pending'
      });

      return code;
    } else {
      throw new Error(result.result?.message || '生成邀请失败');
    }
  },

  /**
   * 构建分享配置
   */
  buildShareConfig(code) {
    const { user } = this.data;
    const currentUser = app.globalData.userInfo;

    return {
      title: `${currentUser.name} 邀请您成为「${user.role === 'teacher' ? '老师' : '学生'}」`,
      path: `/pages/bind/bind?code=${code}`,
      imageUrl: ''  // 可添加自定义分享图片
    };
  },

  /**
   * 分享给好友 - 点击 open-type="share" 按钮时触发
   * 返回 Promise 支持异步生成邀请码
   */
  onShareAppMessage() {
    const { user, inviteInfo } = this.data;

    // 如果已有有效邀请码，直接使用
    if (inviteInfo && inviteInfo.code) {
      console.log('[分享] 使用已有邀请码:', inviteInfo.code);
      return this.buildShareConfig(inviteInfo.code);
    }

    // 否则异步生成邀请码
    console.log('[分享] 开始生成新邀请码...');
    return new Promise((resolve) => {
      this.generateInvite()
        .then(code => {
          console.log('[分享] 邀请码生成成功:', code);
          resolve(this.buildShareConfig(code));
        })
        .catch(error => {
          console.error('[分享] 生成邀请码失败:', error);
          // 失败时返回默认分享配置
          wx.showToast({
            title: '生成邀请失败',
            icon: 'none'
          });
          resolve({
            title: '排课系统',
            path: '/pages/index/index'
          });
        });
    });
  },

  /**
   * 编辑用户
   */
  handleEdit() {
    const { userId } = this.data;
    wx.navigateTo({
      url: `/pages/users/edit/edit?id=${userId}`
    });
  },

  /**
   * 删除用户
   */
  async handleDelete() {
    const { user, userId } = this.data;
    const userInfo = app.globalData.userInfo;
    const currentUserId = userInfo?._id || userInfo?.userId;

    const confirmed = await showConfirm('确认删除', `确定要删除「${user.name}」吗？`);
    if (!confirmed) return;

    showLoading('删除中...');

    try {
      const result = await wx.cloud.callFunction({
        name: 'user',
        data: {
          action: 'delete',
          currentUserId, // 传递当前用户ID
          userId
        }
      });

      hideLoading();

      if (result.result && result.result.success) {
        wx.showToast({
          title: '删除成功',
          icon: 'success',
          duration: 1500,
          success: () => {
            setTimeout(() => {
              wx.navigateBack();
            }, 1500);
          }
        });
      } else {
        showToast(result.result?.message || '删除失败');
      }
    } catch (error) {
      hideLoading();
      console.error('删除用户失败:', error);
      showError('删除失败');
    }
  }
});




