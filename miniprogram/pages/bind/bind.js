// pages/bind/bind.js
const app = getApp();
const { userApi, showLoading, hideLoading, showError, showToast, showConfirm } = require('../../utils/api');

Page({
  data: {
    inviteCode: '',
    inviteInfo: null,       // 邀请信息
    isLoading: true,        // 加载邀请信息中
    isValid: false,         // 邀请是否有效
    errorMessage: '',       // 错误信息
    
    // 绑定表单
    phone: '',
    password: '',
    confirmPassword: '',
    showPassword: false,
    isSubmitting: false
  },

  onLoad(options) {
    const { code } = options;
    
    if (code) {
      this.setData({ inviteCode: code });
      this.loadInviteInfo(code);
    } else {
      this.setData({
        isLoading: false,
        isValid: false,
        errorMessage: '无效的邀请链接'
      });
    }
  },

  /**
   * 加载邀请信息
   */
  async loadInviteInfo(code) {
    try {
      const result = await wx.cloud.callFunction({
        name: 'user',
        data: {
          action: 'getInviteInfo',
          code
        }
      });

      if (result.result && result.result.success) {
        this.setData({
          isLoading: false,
          isValid: true,
          inviteInfo: result.result.data
        });
      } else {
        this.setData({
          isLoading: false,
          isValid: false,
          errorMessage: result.result?.message || '邀请已失效'
        });
      }
    } catch (error) {
      console.error('加载邀请信息失败:', error);
      this.setData({
        isLoading: false,
        isValid: false,
        errorMessage: '加载失败，请重试'
      });
    }
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
   * 确认密码输入
   */
  onConfirmPasswordInput(e) {
    this.setData({
      confirmPassword: e.detail.value
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
    const { phone, password, confirmPassword } = this.data;
    
    if (!phone) {
      showToast('请输入ID');
      return false;
    }
    
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      showToast('请输入正确的ID');
      return false;
    }
    
    if (!password) {
      showToast('请设置登录密码');
      return false;
    }
    
    if (password.length < 6) {
      showToast('密码至少6位');
      return false;
    }
    
    if (password !== confirmPassword) {
      showToast('两次密码不一致');
      return false;
    }
    
    return true;
  },

  /**
   * 确认绑定
   */
  async handleBind() {
    if (!this.validateForm()) return;
    if (this.data.isSubmitting) return;
    
    const { inviteCode, phone, password } = this.data;
    
    this.setData({ isSubmitting: true });
    showLoading('绑定中...');
    
    try {
      const result = await wx.cloud.callFunction({
        name: 'user',
        data: {
          action: 'bind',
          inviteCode,
          phone,
          password
        }
      });
      
      hideLoading();
      
      if (result.result && result.result.success) {
        // 保存登录信息
        app.setLoginInfo(result.result.data, result.result.data.token);
        
        wx.showToast({
          title: '绑定成功',
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
      } else {
        const errorMsg = result.result?.message || '绑定失败';
        showToast(errorMsg);
      }
    } catch (error) {
      hideLoading();
      console.error('绑定失败:', error);
      showError('绑定失败');
    } finally {
      this.setData({ isSubmitting: false });
    }
  },

  /**
   * 返回首页
   */
  goHome() {
    wx.reLaunch({
      url: '/pages/index/index'
    });
  },

  /**
   * 跳转登录
   */
  goToLogin() {
    wx.navigateTo({
      url: '/pages/login/login'
    });
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
  }
});

