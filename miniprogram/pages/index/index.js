// pages/index/index.js - 登录后首页
const app = getApp();

Page({
  data: {
    userInfo: null,
    greeting: '',
    pendingCount: 0  // 待审批学生数量
  },

  onLoad() {
    this.setGreeting();
  },

  /**
   * 设置问候语
   */
  setGreeting() {
    const hour = new Date().getHours();
    let greeting = '';
    
    if (hour < 6) {
      greeting = '夜深了';
    } else if (hour < 9) {
      greeting = '早上好';
    } else if (hour < 12) {
      greeting = '上午好';
    } else if (hour < 14) {
      greeting = '中午好';
    } else if (hour < 18) {
      greeting = '下午好';
    } else if (hour < 22) {
      greeting = '晚上好';
    } else {
      greeting = '夜深了';
    }
    
    this.setData({ greeting });
  },

  onShow() {
    // 检查登录状态，未登录则跳转到公开首页
    app.onReady(() => {
      this.checkLogin();
    });
  },

  /**
   * 检查登录状态
   */
  checkLogin() {
    const isLoggedIn = app.globalData.isLoggedIn;
    const userInfo = app.globalData.userInfo;
    
    if (!isLoggedIn) {
      // 未登录，跳转到宣传首页
      wx.reLaunch({
        url: '/pages/promo/index'
      });
      return;
    }

    this.setData({ userInfo });

    // 如果是校长，获取待审批数量
    if (userInfo && userInfo.role === 'principal') {
      this.loadPendingCount();
    }
  },

  /**
   * 获取待审批学生数量
   */
  async loadPendingCount() {
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
        this.setData({
          pendingCount: result.result.data.totalCount || 0
        });
      }
    } catch (error) {
      console.error('获取待审批数量失败:', error);
    }
  },

  /**
   * 跳转到课程表
   */
  goToSchedule() {
    wx.navigateTo({
      url: '/pages/schedule/index/index'
    });
  },

  /**
   * 跳转到我的老师
   */
  goToTeachers() {
    wx.navigateTo({
      url: '/pages/users/list/list?type=teacher'
    });
  },

  /**
   * 跳转到我的学生
   */
  goToStudents() {
    wx.navigateTo({
      url: '/pages/users/list/list?type=student'
    });
  },

  /**
   * 跳转到注册审批
   */
  goToApproval() {
    wx.navigateTo({
      url: '/pages/approval/list/list'
    });
  },

  /**
   * 跳转到宣传首页（公开信息）
   */
  goToPromo() {
    wx.navigateTo({
      url: '/pages/promo/index'
    });
  },

  /**
   * 退出登录
   */
  handleLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除登录信息
          app.clearLoginInfo();
          
          // 跳转到宣传首页
          wx.reLaunch({
            url: '/pages/promo/index'
          });

          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          });
        }
      }
    });
  }
});
