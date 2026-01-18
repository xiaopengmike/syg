// pages/schedule/detail/detail.js
const app = getApp();

Page({
  data: {
    scheduleId: '',
    schedule: null,
    canEdit: false,
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
      this.setData({ scheduleId: id });
      this.loadScheduleDetail(id);
    } else {
      wx.showToast({ title: '参数错误', icon: 'none' });
      wx.navigateBack();
    }
  },

  onShow() {
    // 返回时刷新数据
    if (this.data.scheduleId && !this.data.isLoading) {
      this.loadScheduleDetail(this.data.scheduleId);
    }
  },

  /**
   * 加载课程详情
   */
  async loadScheduleDetail(scheduleId) {
    this.setData({ isLoading: true });

    try {
      const userInfo = app.globalData.userInfo;
      const userId = userInfo?._id || userInfo?.userId;

      const result = await wx.cloud.callFunction({
        name: 'schedule',
        data: {
          action: 'detail',
          scheduleId,
          userId
        }
      });

      if (result.result && result.result.success) {
        const { schedule, canEdit } = result.result.data;

        // 格式化数据
        schedule.createdAtStr = this.formatDate(schedule.createdAt);
        schedule.dayOfWeekStr = this.getDayOfWeekStr(schedule.date);

        this.setData({
          schedule,
          canEdit
        });

        // 更新导航栏标题
        wx.setNavigationBarTitle({
          title: schedule.courseName
        });
      } else {
        wx.showToast({ title: result.result?.message || '加载失败', icon: 'none' });
        setTimeout(() => wx.navigateBack(), 1500);
      }
    } catch (error) {
      console.error('加载课程详情失败:', error);
      wx.showToast({ title: '加载失败', icon: 'none' });
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
   * 获取星期几字符串
   */
  getDayOfWeekStr(dateStr) {
    const date = new Date(dateStr);
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return days[date.getDay()];
  },

  /**
   * 编辑课程
   */
  handleEdit() {
    const { scheduleId } = this.data;
    wx.navigateTo({
      url: `/pages/schedule/create/create?id=${scheduleId}`
    });
  },

  /**
   * 删除课程
   */
  async handleDelete() {
    const { schedule, scheduleId } = this.data;

    const confirmed = await new Promise(resolve => {
      wx.showModal({
        title: '确认删除',
        content: `确定要删除「${schedule.courseName}」吗？`,
        success: res => resolve(res.confirm)
      });
    });

    if (!confirmed) return;

    wx.showLoading({ title: '删除中...' });

    try {
      const userInfo = app.globalData.userInfo;
      const userId = userInfo?._id || userInfo?.userId;

      const result = await wx.cloud.callFunction({
        name: 'schedule',
        data: {
          action: 'delete',
          scheduleId,
          userId
        }
      });

      wx.hideLoading();

      if (result.result && result.result.success) {
        wx.showToast({ title: '删除成功', icon: 'success' });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        wx.showToast({ title: result.result?.message || '删除失败', icon: 'none' });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('删除课程失败:', error);
      wx.showToast({ title: '删除失败', icon: 'none' });
    }
  }
});


