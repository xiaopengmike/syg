// pages/users/add/add.js
const app = getApp();
const { showLoading, hideLoading, showToast, showError } = require('../../../utils/api');

Page({
  data: {
    role: 'teacher',
    name: '',
    subject: '',
    remark: '',
    isSubmitting: false
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

    const role = options.role || 'teacher';
    this.setData({ role });
    
    // 更新导航栏标题
    wx.setNavigationBarTitle({
      title: `添加${role === 'teacher' ? '老师' : '学生'}`
    });
  },

  onNameInput(e) {
    this.setData({ name: e.detail.value });
  },

  onSubjectInput(e) {
    this.setData({ subject: e.detail.value });
  },

  onRemarkInput(e) {
    this.setData({ remark: e.detail.value });
  },

  /**
   * 验证表单
   */
  validateForm() {
    const { name } = this.data;

    if (!name || !name.trim()) {
      showToast('请输入姓名');
      return false;
    }

    if (name.trim().length < 2) {
      showToast('姓名至少2个字');
      return false;
    }

    return true;
  },

  /**
   * 保存
   */
  async handleSave() {
    if (!this.validateForm()) return;
    if (this.data.isSubmitting) return;

    const { role, name, subject, remark } = this.data;
    const userInfo = app.globalData.userInfo;
    const currentUserId = userInfo?._id || userInfo?.userId;

    this.setData({ isSubmitting: true });
    showLoading('保存中...');

    try {
      const result = await wx.cloud.callFunction({
        name: 'user',
        data: {
          action: 'add',
          currentUserId, // 传递当前用户ID
          role,
          name: name.trim(),
          subject: role === 'teacher' ? subject.trim() : '',
          remark: remark.trim()
        }
      });

      hideLoading();

      if (result.result && result.result.success) {
        wx.showToast({
          title: '添加成功',
          icon: 'success',
          duration: 1500,
          success: () => {
            setTimeout(() => {
              wx.navigateBack();
            }, 1500);
          }
        });
      } else {
        showToast(result.result?.message || '添加失败');
      }
    } catch (error) {
      hideLoading();
      console.error('添加用户失败:', error);
      showError('添加失败');
    } finally {
      this.setData({ isSubmitting: false });
    }
  }
});





