// pages/login/login.js
const app = getApp();
const { userApi, showLoading, hideLoading, showError, showToast } = require('../../utils/api');

Page({
  data: {
    phone: '',
    password: '',
    isSubmitting: false,
    showPassword: false
  },

  onLoad(options) {
    // 等待 app 初始化完成后检查登录状态
    app.onReady(() => {
      // 如果已登录，直接跳转首页
      if (app.globalData.isLoggedIn) {
        wx.switchTab({
          url: '/pages/index/index'
        });
      }
    });
  },

  /**
   * ID输入
   */
  onPhoneInput(e) {
    this.setData({
      phone: e.detail.value
    });
  },

  /**
   * 密码输入
   */
  onPasswordInput(e) {
    this.setData({
      password: e.detail.value
    });
  },

  /**
   * 切换密码显示/隐藏
   */
  togglePassword() {
    this.setData({
      showPassword: !this.data.showPassword
    });
  },

  /**
   * 表单验证
   */
  validateForm() {
    const { phone, password } = this.data;
    
    if (!phone) {
      showToast('请输入ID');
      return false;
    }
    
    if (!password) {
      showToast('请输入密码');
      return false;
    }
    
    if (password.length < 6) {
      showToast('密码至少6位');
      return false;
    }
    
    return true;
  },

  /**
   * 登录
   */
  async handleLogin() {
    if (!this.validateForm()) return;
    if (this.data.isSubmitting) return;
    
    const { phone, password } = this.data;
    
    this.setData({ isSubmitting: true });
    showLoading('登录中...');
    
    try {
      const result = await userApi.login(phone, password);
      
      hideLoading();
      
      if (result.success) {
        // 保存登录信息
        app.setLoginInfo(result.data, result.data.token);
        
        wx.showToast({
          title: '登录成功',
          icon: 'success',
          duration: 1500,
          success: () => {
            setTimeout(() => {
              wx.reLaunch({
                url: '/pages/index/index'
              });
            }, 1500);
          }
        });
      }
    } catch (error) {
      hideLoading();
      
      // 处理不同错误类型
      switch (error.code) {
        case 'USER_NOT_FOUND':
          showToast('ID不存在');
          break;
        case 'WRONG_PASSWORD':
          showToast('密码错误');
          break;
        case 'ACCOUNT_LOCKED':
          showToast('ID已锁定，请稍后再试');
          break;
        default:
          showError('登录失败');
      }
    } finally {
      this.setData({ isSubmitting: false });
    }
  },

  /**
   * 跳转注册页
   */
  goToRegister() {
    wx.navigateTo({
      url: '/pages/register/register'
    });
  }
});
