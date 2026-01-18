// pages/index/index.js
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
    // 等待 app 初始化完成后检查登录状态
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

    // 如果未登录，跳转到登录页
    // if (!isLoggedIn) {
    //   wx.redirectTo({
    //     url: '/pages/login/login'
    //   });
    // }
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
   * 获取角色显示名称
   */
  getRoleName(role) {
    const roleMap = {
      principal: '校长',
      teacher: '老师',
      student: '学生'
    };
    return roleMap[role] || '用户';
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
   * 跳转到课程表
   */
  goToSchedule() {
    if (!this.data.isLoggedIn) {
      wx.showToast({
        title: '请登录后使用',
        icon: 'none'
      });
      return;
    }
    wx.navigateTo({
      url: '/pages/schedule/index/index'
    });
  },

  /**
   * 跳转到冲突检测（功能暂未实现）
   */
  goToConflict() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
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
   * 跳转到个人中心（功能暂未实现）
   */
  goToProfile() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
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
          
          // 更新页面状态
          this.setData({
            isLoggedIn: false,
            userInfo: null
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

