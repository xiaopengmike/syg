// pages/schedule/create/create.js
const app = getApp();

Page({
  data: {
    isEdit: false,
    scheduleId: '',
    formData: {
      courseName: '',
      teacherId: '',
      teacherName: '',
      date: '',
      startTime: '',
      endTime: '',
      location: '',
      remark: '',
      studentIds: []
    },
    currentUser: null,
    isPrincipal: false,
    isTeacher: false,
    teacherList: [],
    teacherIndex: -1,
    studentList: [],
    selectedStudents: [],
    selectedCount: 0,
    showStudentPicker: false,
    isSubmitting: false,
    // 时间和时长选项
    startTimeOptions: [],
    startTimeIndex: -1,
    durationOptions: ['1小时', '2小时'],
    durationIndex: 0,
    durationValue: 1 // 默认1小时
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

    const rawUser = app.globalData.userInfo;
    // 兼容处理：确保有 _id 字段
    const currentUser = rawUser ? {
      ...rawUser,
      _id: rawUser._id || rawUser.userId  // 兼容旧数据
    } : null;

    const isPrincipal = currentUser?.role === 'principal';
    const isTeacher = currentUser?.role === 'teacher';

    console.log('[schedule/create] currentUser:', currentUser);
    console.log('[schedule/create] isPrincipal:', isPrincipal, 'isTeacher:', isTeacher);

    this.setData({
      currentUser,
      isPrincipal,
      isTeacher
    });

    // 如果是老师，自动设置教师为自己
    if (isTeacher) {
      this.setData({
        'formData.teacherId': currentUser._id,
        'formData.teacherName': currentUser.name
      });
    }

    // 初始化开始时间选项 (08:00 - 21:30, 每30分钟一个)
    this.initStartTimeOptions();

    // 检查是否编辑模式
    if (options.id) {
      this.setData({
        isEdit: true,
        scheduleId: options.id
      });
      wx.setNavigationBarTitle({ title: '编辑排课' });
      this.loadScheduleDetail(options.id);
    } else {
      // 创建模式，可能有预设日期和时间
      if (options.date) {
        this.setData({ 'formData.date': options.date });
      }
      if (options.hour) {
        const hour = parseInt(options.hour);
        const minute = options.minute ? parseInt(options.minute) : 0;
        const startTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        this.setData({ 'formData.startTime': startTime });
        this.updateStartTimeIndex(startTime);
        this.calculateEndTime();
      }
    }

    // 加载教师和学生列表
    if (isPrincipal) {
      this.loadTeachers();
    }
    this.loadStudents();
  },

  /**
   * 加载课程详情（编辑模式）
   */
  async loadScheduleDetail(scheduleId) {
    wx.showLoading({ title: '加载中...' });

    try {
      const result = await wx.cloud.callFunction({
        name: 'schedule',
        data: {
          action: 'detail',
          scheduleId
        }
      });

      wx.hideLoading();

      if (result.result && result.result.success) {
        const { schedule } = result.result.data;
        this.setData({
          formData: {
            courseName: schedule.courseName,
            teacherId: schedule.teacherId,
            teacherName: schedule.teacher?.name || '',
            date: schedule.date,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            location: schedule.location || '',
            remark: schedule.remark || '',
            studentIds: schedule.studentIds || []
          },
          selectedStudents: schedule.students || []
        });

        // 更新索引和结束时间
        this.updateStartTimeIndex(schedule.startTime);
        this.updateDurationIndex(schedule.startTime, schedule.endTime);
      } else {
        wx.showToast({ title: '加载失败', icon: 'none' });
        setTimeout(() => wx.navigateBack(), 1500);
      }
    } catch (error) {
      wx.hideLoading();
      console.error('加载课程详情失败:', error);
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  /**
   * 加载教师列表
   */
  async loadTeachers() {
    try {
      const { currentUser } = this.data;
      const result = await wx.cloud.callFunction({
        name: 'user',
        data: {
          action: 'list',
          role: 'teacher',
          currentUserId: currentUser?._id
        }
      });

      if (result.result && result.result.success) {
        const teacherList = result.result.data.list;
        this.setData({ teacherList });

        // 如果是编辑模式，设置教师选择索引
        if (this.data.formData.teacherId) {
          const index = teacherList.findIndex(t => t._id === this.data.formData.teacherId);
          if (index !== -1) {
            this.setData({ teacherIndex: index });
          }
        }
      }
    } catch (error) {
      console.error('加载教师列表失败:', error);
    }
  },

  /**
   * 加载学生列表
   */
  async loadStudents() {
    try {
      const { currentUser } = this.data;
      const result = await wx.cloud.callFunction({
        name: 'user',
        data: {
          action: 'list',
          role: 'student',
          currentUserId: currentUser?._id
        }
      });

      if (result.result && result.result.success) {
        const { selectedStudents } = this.data;
        const selectedIds = selectedStudents.map(s => s._id);

        // 标记已选中的学生
        const studentList = result.result.data.list.map(s => ({
          ...s,
          selected: selectedIds.includes(s._id)
        }));

        this.setData({
          studentList,
          selectedCount: selectedIds.length
        });
      }
    } catch (error) {
      console.error('加载学生列表失败:', error);
    }
  },

  /**
   * 输入框变化
   */
  onInput(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({
      [`formData.${field}`]: e.detail.value
    });
  },

  /**
   * 选择教师
   */
  onTeacherChange(e) {
    const index = e.detail.value;
    const teacher = this.data.teacherList[index];
    this.setData({
      teacherIndex: index,
      'formData.teacherId': teacher._id,
      'formData.teacherName': teacher.name
    });
  },

  /**
   * 选择日期
   */
  onDateChange(e) {
    this.setData({
      'formData.date': e.detail.value
    });
  },

  /**
   * 初始化开始时间选项
   */
  initStartTimeOptions() {
    const options = [];
    for (let h = 8; h <= 21; h++) {
      const hour = String(h).padStart(2, '0');
      options.push(`${hour}:00`);
      options.push(`${hour}:30`);
    }
    this.setData({ startTimeOptions: options });
  },

  /**
   * 根据时间值更新开始时间索引
   */
  updateStartTimeIndex(startTime) {
    if (!startTime) return;
    const index = this.data.startTimeOptions.indexOf(startTime);
    if (index !== -1) {
      this.setData({ startTimeIndex: index });
    }
  },

  /**
   * 根据开始和结束时间计算时长索引
   */
  updateDurationIndex(start, end) {
    if (!start || !end) return;
    const startMin = this.timeToMinutes(start);
    const endMin = this.timeToMinutes(end);
    const diffHours = (endMin - startMin) / 60;

    if (diffHours === 1) {
      this.setData({ durationIndex: 0, durationValue: 1 });
    } else if (diffHours === 2) {
      this.setData({ durationIndex: 1, durationValue: 2 });
    }
  },

  /**
   * 时间转分钟
   */
  timeToMinutes(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  },

  /**
   * 分钟转时间字符串
   */
  minutesToTime(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  },

  /**
   * 计算结束时间
   */
  calculateEndTime() {
    const { startTime } = this.data.formData;
    const { durationValue } = this.data;
    if (!startTime) return;

    const startMin = this.timeToMinutes(startTime);
    const endMin = startMin + (durationValue * 60);
    const endTime = this.minutesToTime(endMin);

    this.setData({
      'formData.endTime': endTime
    });
  },

  /**
   * 选择开始时间
   */
  onStartTimeChange(e) {
    const index = e.detail.value;
    const startTime = this.data.startTimeOptions[index];
    this.setData({
      startTimeIndex: index,
      'formData.startTime': startTime
    });
    this.calculateEndTime();
  },

  /**
   * 选择时长
   */
  onDurationChange(e) {
    const index = parseInt(e.detail.value);
    const durationValue = index === 0 ? 1 : 2;
    this.setData({
      durationIndex: index,
      durationValue: durationValue
    });
    this.calculateEndTime();
  },

  /**
   * 打开学生选择弹窗
   */
  openStudentPicker() {
    this.setData({ showStudentPicker: true });
  },

  /**
   * 关闭学生选择弹窗
   */
  closeStudentPicker() {
    this.setData({ showStudentPicker: false });
  },

  /**
   * 切换学生选中状态
   */
  toggleStudent(e) {
    const { index } = e.currentTarget.dataset;
    const { studentList } = this.data;

    studentList[index].selected = !studentList[index].selected;

    const selectedCount = studentList.filter(s => s.selected).length;

    this.setData({
      studentList,
      selectedCount
    });
  },

  /**
   * 确认学生选择
   */
  confirmStudents() {
    const { studentList } = this.data;
    const selectedStudents = studentList.filter(s => s.selected);
    const studentIds = selectedStudents.map(s => s._id);

    this.setData({
      selectedStudents,
      'formData.studentIds': studentIds,
      showStudentPicker: false
    });
  },

  /**
   * 表单验证
   */
  validateForm() {
    const { formData, isPrincipal } = this.data;

    if (!formData.courseName.trim()) {
      wx.showToast({ title: '请输入课程名称', icon: 'none' });
      return false;
    }

    if (isPrincipal && !formData.teacherId) {
      wx.showToast({ title: '请选择授课教师', icon: 'none' });
      return false;
    }

    if (!formData.date) {
      wx.showToast({ title: '请选择上课日期', icon: 'none' });
      return false;
    }

    if (!formData.startTime) {
      wx.showToast({ title: '请选择开始时间', icon: 'none' });
      return false;
    }

    if (!formData.endTime) {
      wx.showToast({ title: '请选择结束时间', icon: 'none' });
      return false;
    }

    if (formData.startTime >= formData.endTime) {
      wx.showToast({ title: '结束时间必须大于开始时间', icon: 'none' });
      return false;
    }

    if (!formData.studentIds || formData.studentIds.length === 0) {
      wx.showToast({ title: '请选择至少一名参与学生', icon: 'none' });
      return false;
    }

    return true;
  },

  /**
   * 提交表单
   */
  async handleSubmit() {
    if (!this.validateForm()) return;
    if (this.data.isSubmitting) return;

    const { formData, isEdit, scheduleId } = this.data;

    this.setData({ isSubmitting: true });
    wx.showLoading({ title: isEdit ? '保存中...' : '创建中...' });

    try {
      const { currentUser } = this.data;
      console.log('[schedule/create] Submitting with currentUser:', currentUser);
      console.log('[schedule/create] userId to send:', currentUser?._id);

      const result = await wx.cloud.callFunction({
        name: 'schedule',
        data: {
          action: isEdit ? 'update' : 'create',
          scheduleId: isEdit ? scheduleId : undefined,
          userId: currentUser?._id,  // 传递当前用户ID
          courseName: formData.courseName,
          teacherId: formData.teacherId,
          studentIds: formData.studentIds,
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          location: formData.location,
          remark: formData.remark
        }
      });

      wx.hideLoading();

      if (result.result && result.result.success) {
        wx.showToast({
          title: isEdit ? '保存成功' : '创建成功',
          icon: 'success'
        });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else if (result.result?.code === 'CONFLICT') {
        // 冲突检测失败，显示冲突详情
        const conflicts = result.result.data?.conflicts || [];
        const messages = conflicts.map(c => c.message).join('\n');
        wx.showModal({
          title: '检测到冲突',
          content: messages || '该时间段已有其他课程',
          showCancel: false,
          confirmText: '知道了'
        });
      } else {
        wx.showToast({
          title: result.result?.message || '操作失败',
          icon: 'none'
        });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('提交失败:', error);
      wx.showToast({ title: '操作失败', icon: 'none' });
    } finally {
      this.setData({ isSubmitting: false });
    }
  }
});

