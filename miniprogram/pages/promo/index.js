// pages/promo/index.js - 宣传首页
const app = getApp();

Page({
  data: {
    isLoggedIn: false,
    userInfo: null,
    greeting: ''
  },

  onLoad() {
    this.setGreeting();
  },

  onShow() {
    // 检查登录状态
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
    
    this.setData({
      isLoggedIn,
      userInfo
    });
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

  /**
   * 跳转到登录页
   */
  goToLogin() {
    wx.navigateTo({
      url: '/pages/login/login'
    });
  },

  /**
   * 进入系统首页（课程系统按钮）
   */
  goToSystem() {
    if (!this.data.isLoggedIn) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    wx.reLaunch({
      url: '/pages/index/index'
    });
  },

  /**
   * 跳转到校区参观
   */
  goToCampusTour() {
    wx.navigateTo({
      url: '/pages/campus-tour/index'
    });
  },

  /**
   * 跳转到课程介绍
   */
  goToCourseIntro() {
    wx.navigateTo({
      url: '/pages/course-intro/index'
    });
  }
});
