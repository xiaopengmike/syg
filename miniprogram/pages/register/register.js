// pages/register/register.js
const app = getApp();
const { userApi, showLoading, hideLoading, showError, showToast } = require('../../utils/api');

Page({
  data: {
    role: 'teacher',      // 默认选择老师
    phone: '',
    name: '',
    subject: '',          // 老师科目
    className: '',        // 学生班级
    password: '',
    confirmPassword: '',
    showPassword: false,
    isSubmitting: false
  },

  /**
   * 选择角色
   */
  selectRole(e) {
    const role = e.currentTarget.dataset.role;
    this.setData({ role });
  },

  /**
   * ID输入
   */
  onPhoneInput(e) {
    this.setData({ phone: e.detail.value });
  },

  /**
   * 姓名输入
   */
  onNameInput(e) {
    this.setData({ name: e.detail.value });
  },

  /**
   * 科目输入
   */
  onSubjectInput(e) {
    this.setData({ subject: e.detail.value });
  },

  /**
   * 班级输入
   */
  onClassNameInput(e) {
    this.setData({ className: e.detail.value });
  },

  /**
   * 密码输入
   */
  onPasswordInput(e) {
    this.setData({ password: e.detail.value });
  },

  /**
   * 确认密码输入
   */
  onConfirmPasswordInput(e) {
    this.setData({ confirmPassword: e.detail.value });
  },

  /**
   * 切换密码显示
   */
  togglePassword() {
    this.setData({ showPassword: !this.data.showPassword });
  },

  /**
   * 表单验证
   */
  validateForm() {
    const { role, phone, name, password, confirmPassword } = this.data;

    if (!role) {
      showToast('请选择角色');
      return false;
    }

    if (!phone) {
      showToast('请输入ID');
      return false;
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      showToast('请输入正确的ID');
      return false;
    }

    if (!name) {
      showToast('请输入姓名');
      return false;
    }

    if (name.length < 2) {
      showToast('姓名至少2个字');
      return false;
    }

    if (!password) {
      showToast('请设置密码');
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
   * 注册
   */
  async handleRegister() {
    if (!this.validateForm()) return;
    if (this.data.isSubmitting) return;

    const { role, phone, name, subject, className, password } = this.data;

    this.setData({ isSubmitting: true });
    showLoading('注册中...');

    try {
      const result = await userApi.register({
        role,
        phone,
        name,
        subject: role === 'teacher' ? subject : '',
        className: role === 'student' ? className : '',
        password
      });

      hideLoading();

      if (result.success) {
        // 学生注册需要审批，不自动登录
        if (result.needsApproval) {
          wx.showModal({
            title: '注册成功',
            content: '您的注册申请已提交，请等待校长审批后再登录。',
            showCancel: false,
            confirmText: '我知道了',
            success: () => {
              wx.navigateTo({
                url: '/pages/login/login'
              });
            }
          });
        } else {
          // 老师注册直接登录
          app.setLoginInfo(result.data, result.data.token);

          wx.showToast({
            title: '注册成功',
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
      }
    } catch (error) {
      hideLoading();

      // 处理错误
      switch (error.code) {
        case 'PHONE_EXISTS':
          showToast('该ID已注册');
          break;
        case 'INVALID_ROLE':
          showToast('角色选择错误');
          break;
        default:
          showError('注册失败');
      }
    } finally {
      this.setData({ isSubmitting: false });
    }
  },

  /**
   * 跳转登录
   */
  goToLogin() {
    wx.navigateTo({
      url: '/pages/login/login'
    });
  }
});

