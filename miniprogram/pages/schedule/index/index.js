// pages/schedule/index/index.js
const app = getApp();

Page({
  data: {
    courses: [],
    isLoading: false,
    canCreate: false,
    isPrincipal: false,
    currentWeekStart: '',
    currentWeekEnd: '',
    // 教师筛选
    teacherOptions: [{ _id: '', name: '全部' }],
    teacherIndex: 0,
    selectedTeacherId: '',
    selectedTeacherName: '全部',
    // 学生筛选
    studentOptions: [{ _id: '', name: '全部' }],
    studentIndex: 0,
    selectedStudentId: '',
    selectedStudentName: '全部'
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
        content: '请先登录后查看课表',
        showCancel: false,
        success: () => {
          wx.redirectTo({
            url: '/pages/login/login'
          });
        }
      });
      return;
    }

    // 同步保存到实例变量，避免 setData 异步导致的时序问题
    this._filterStudentId = options.studentId || '';
    this._filterStudentName = options.studentName || '';

    // 检查是否有学生 ID 传入
    if (options.studentId) {
      this.setData({
        selectedStudentId: options.studentId,
        selectedStudentName: options.studentName || '学生',
        // 如果是看特定学生课表，重置教师筛选
        selectedTeacherId: '',
        selectedTeacherName: '全部',
        teacherIndex: 0
      });
    }

    this.checkPermission();
    this.loadTeachers();
    this.loadStudents(); // 加载学生列表用于筛选
  },

  onShow() {
    // 等待 app 初始化完成后检查登录状态
    app.onReady(() => {
      // 检查登录状态
      if (!app.globalData.isLoggedIn) {
        wx.redirectTo({
          url: '/pages/login/login'
        });
        return;
      }

      // 重新同步页面参数，防止页面复用导致的问题
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      if (currentPage.options?.studentId) {
        this._filterStudentId = currentPage.options.studentId;
        // 同时确保 data 中的值也是最新的
        if (this.data.selectedStudentId !== currentPage.options.studentId) {
          this.setData({
            selectedStudentId: currentPage.options.studentId,
            selectedStudentName: currentPage.options.studentName || '学生'
          });
        }
      }

      // 如果有周数据，刷新课程
      console.log('[schedule/index] onShow, currentWeekStart:', this.data.currentWeekStart, 'filterStudentId:', this._filterStudentId);
      if (this.data.currentWeekStart) {
        this.loadCourses();
      }
    });
  },

  /**
   * 检查创建权限
   */
  checkPermission() {
    const userInfo = app.globalData.userInfo;
    const canCreate = userInfo && (userInfo.role === 'principal' || userInfo.role === 'teacher');
    const isPrincipal = userInfo?.role === 'principal';
    this.setData({ canCreate, isPrincipal });
  },

  /**
   * 加载教师列表（用于筛选）
   */
  async loadTeachers() {
    const userInfo = app.globalData.userInfo;
    if (userInfo?.role !== 'principal') return;

    try {
      const result = await wx.cloud.callFunction({
        name: 'user',
        data: {
          action: 'list',
          role: 'teacher',
          currentUserId: userInfo?._id
        }
      });

      if (result.result && result.result.success) {
        const teachers = result.result.data.list || [];
        const teacherOptions = [
          { _id: '', name: '全部' },
          ...teachers.map(t => ({ _id: t._id, name: t.name }))
        ];
        this.setData({ teacherOptions });
      }
    } catch (error) {
      console.error('加载教师列表失败:', error);
    }
  },

  /**
   * 加载学生列表（用于筛选）
   */
  async loadStudents() {
    const userInfo = app.globalData.userInfo;
    if (userInfo?.role !== 'principal') return;

    try {
      const result = await wx.cloud.callFunction({
        name: 'user',
        data: {
          action: 'list',
          role: 'student',
          currentUserId: userInfo?._id
        }
      });

      if (result.result && result.result.success) {
        const students = result.result.data.list || [];
        const studentOptions = [
          { _id: '', name: '全部' },
          ...students.map(s => ({ _id: s._id, name: s.name }))
        ];
        this.setData({ studentOptions });

        // 如果是从学生列表进入，设置选中
        if (this._filterStudentId) {
          const index = studentOptions.findIndex(s => s._id === this._filterStudentId);
          if (index !== -1) {
            this.setData({
              studentIndex: index,
              selectedStudentName: studentOptions[index].name
            });
          }
        }
      }
    } catch (error) {
      console.error('加载学生列表失败:', error);
    }
  },

  /**
   * 教师筛选变化
   */
  onTeacherFilter(e) {
    const index = e.detail.value;
    const teacher = this.data.teacherOptions[index];
    this.setData({
      teacherIndex: index,
      selectedTeacherId: teacher._id,
      selectedTeacherName: teacher.name
    });
    this.loadCourses();
  },

  /**
   * 学生筛选变化
   */
  onStudentFilter(e) {
    const index = e.detail.value;
    const student = this.data.studentOptions[index];
    this._filterStudentId = student._id;
    this.setData({
      studentIndex: index,
      selectedStudentId: student._id,
      selectedStudentName: student.name
    });
    this.loadCourses();
  },

  /**
   * 周变化时加载课程
   */
  onWeekChange(e) {
    const { startDate, endDate } = e.detail;
    this.setData({
      currentWeekStart: startDate,
      currentWeekEnd: endDate
    });
    this.loadCourses();
  },

  /**
   * 清除学生筛选，查看自己的课表
   */
  clearStudentFilter() {
    // 同时清除实例变量
    this._filterStudentId = '';
    this._filterStudentName = '';
    this.setData({
      studentIndex: 0,
      selectedStudentId: '',
      selectedStudentName: '全部'
    });
    this.loadCourses();
  },

  /**
   * 加载课程列表
   */
  async loadCourses() {
    const { currentWeekStart, currentWeekEnd } = this.data;
    console.log('[schedule/index] loadCourses, weekStart:', currentWeekStart, 'weekEnd:', currentWeekEnd);
    if (!currentWeekStart) return;

    this.setData({ isLoading: true });

    try {
      const userInfo = app.globalData.userInfo;
      // 兼容处理：优先用 _id，其次用 userId
      const userId = userInfo?._id || userInfo?.userId;
      const { selectedTeacherId } = this.data;
      // 优先使用实例变量，避免 setData 异步导致的时序问题
      const filterStudentId = this._filterStudentId || this.data.selectedStudentId;

      console.log('[schedule/index] === 准备调用云函数 ===');
      console.log('[schedule/index] this._filterStudentId:', this._filterStudentId || '(空)');
      console.log('[schedule/index] this.data.selectedStudentId:', this.data.selectedStudentId || '(空)');
      console.log('[schedule/index] 最终 filterStudentId:', filterStudentId || '(空)');
      console.log('[schedule/index] filterStudentId 类型:', typeof filterStudentId);

      const cloudParams = {
        action: 'list',
        userId,
        startDate: currentWeekStart,
        endDate: currentWeekEnd,
        filterTeacherId: selectedTeacherId || undefined,
        filterStudentId: filterStudentId || undefined
      };
      console.log('[schedule/index] 云函数参数:', JSON.stringify(cloudParams));

      const result = await wx.cloud.callFunction({
        name: 'schedule',
        data: cloudParams
      });

      console.log('[schedule/index] loadCourses result:', result.result);

      if (result.result && result.result.success) {
        let courses = this.assignColors(result.result.data.list);

        // 前端兜底过滤：若指定学生，则仅保留包含该学生的课程
        if (filterStudentId) {
          const beforeCount = courses.length;
          courses = courses.filter(c => (c.studentIds || []).includes(filterStudentId));
          console.log('[schedule/index] front filter applied, studentId:', filterStudentId, 'before:', beforeCount, 'after:', courses.length);
        }

        console.log('[schedule/index] courses loaded:', courses.length);
        courses.forEach(c => {
          console.log('[schedule/index] course:', c.courseName, 'students:', c.students);
        });

        this.setData({ courses });
      } else {
        console.error('加载课程失败:', result.result?.message);
      }
    } catch (error) {
      console.error('加载课程失败:', error);
    } finally {
      this.setData({ isLoading: false });
    }
  },

  /**
   * 给课程分配颜色（按教师分组）
   */
  assignColors(courses) {
    const teacherColors = {};
    let colorIndex = 0;

    return courses.map(course => {
      const teacherId = course.teacherId || 'default';
      if (!(teacherId in teacherColors)) {
        teacherColors[teacherId] = colorIndex % 8;
        colorIndex++;
      }
      return {
        ...course,
        colorIndex: teacherColors[teacherId]
      };
    });
  },

  /**
   * 点击空白格子 - 创建课程
   */
  onCellTap(e) {
    if (!this.data.canCreate) return;

    const { date, hour, minute, dayOfWeek } = e.detail;
    wx.navigateTo({
      url: `/pages/schedule/create/create?date=${date}&hour=${hour}&minute=${minute}&dayOfWeek=${dayOfWeek}`
    });
  },

  /**
   * 点击课程 - 查看详情
   */
  onCourseTap(e) {
    const { course } = e.detail;
    wx.navigateTo({
      url: `/pages/schedule/detail/detail?id=${course._id}`
    });
  },

  /**
   * 长按课程 - 快捷操作
   */
  onCourseLongpress(e) {
    const { course } = e.detail;
    const { canCreate } = this.data;

    const itemList = ['查看详情'];
    if (canCreate) {
      itemList.push('编辑', '删除');
    }

    wx.showActionSheet({
      itemList,
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            this.onCourseTap(e);
            break;
          case 1:
            if (canCreate) {
              wx.navigateTo({
                url: `/pages/schedule/create/create?id=${course._id}`
              });
            }
            break;
          case 2:
            if (canCreate) {
              this.deleteCourse(course);
            }
            break;
        }
      }
    });
  },

  /**
   * 删除课程
   */
  async deleteCourse(course) {
    const confirmed = await new Promise(resolve => {
      wx.showModal({
        title: '确认删除',
        content: `确定要删除「${course.courseName}」吗？`,
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
          scheduleId: course._id,
          userId
        }
      });

      wx.hideLoading();

      if (result.result && result.result.success) {
        wx.showToast({ title: '删除成功', icon: 'success' });
        this.loadCourses();
      } else {
        wx.showToast({ title: result.result?.message || '删除失败', icon: 'none' });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('删除课程失败:', error);
      wx.showToast({ title: '删除失败', icon: 'none' });
    }
  },

  /**
   * 跳转到创建页
   */
  goToCreate() {
    wx.navigateTo({
      url: '/pages/schedule/create/create'
    });
  }
});

