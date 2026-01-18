// components/schedule-grid/schedule-grid.js

Component({
  properties: {
    // 课程列表
    courses: {
      type: Array,
      value: [],
      observer: function (newVal) {
        console.log('[schedule-grid] courses observer triggered, length:', newVal ? newVal.length : 0);
        this.bindCourses();
      }
    },
    // 开始时间（小时）
    startHour: {
      type: Number,
      value: 8
    },
    // 结束时间（小时）
    endHour: {
      type: Number,
      value: 22
    }
  },

  data: {
    weekDays: [],        // 本周7天的数据
    weekTitle: '',       // 周标题
    isCurrentWeek: true, // 是否当前周
    timeSlots: [],       // 用于主网格（30分钟粒度）
    hourSlots: [],       // 用于左侧时间列（1小时粒度）
    currentDate: null,   // 当前选中周的起始日期
    CELL_HEIGHT: 120     // 每小时高度（rpx）
  },

  lifetimes: {
    attached() {
      this.initTimeSlots();
      this.goToday();
    }
  },

  methods: {
    /**
     * 初始化时间槽
     */
    initTimeSlots() {
      const { startHour, endHour } = this.properties;
      const tSlots = [];
      const hSlots = [];
      for (let hour = startHour; hour < endHour; hour++) {
        // 主网格记录 30 分钟间隔的数据用于布局和点击
        tSlots.push({ hour, minute: 0, label: `${String(hour).padStart(2, '0')}:00` });
        tSlots.push({ hour, minute: 30, label: `${String(hour).padStart(2, '0')}:30` });

        // 左侧栏记录 1 小时间隔的数据用于显示
        hSlots.push({ hour, label: `${String(hour).padStart(2, '0')}:00` });
      }
      this.setData({
        timeSlots: tSlots,
        hourSlots: hSlots
      });
    },

    /**
     * 设置周数据
     */
    setWeek(startDate) {
      const days = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const weekNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

      // 计算本周的起始日（周一）
      const start = new Date(startDate);

      for (let i = 0; i < 7; i++) {
        const date = new Date(start);
        date.setDate(start.getDate() + i);

        const isToday = date.getTime() === today.getTime();

        days.push({
          date: this.formatDate(date),
          dateStr: `${date.getMonth() + 1}/${date.getDate()}`,
          name: weekNames[date.getDay()],
          dayOfWeek: date.getDay() === 0 ? 7 : date.getDay(), // 转为1-7，周一为1
          isToday,
          courses: []
        });
      }

      // 生成周标题
      const endDate = new Date(start);
      endDate.setDate(start.getDate() + 6);
      const weekTitle = `${start.getMonth() + 1}月${start.getDate()}日 - ${endDate.getMonth() + 1}月${endDate.getDate()}日`;

      // 判断是否当前周
      const currentWeekStart = this.getWeekStart(today);
      const isCurrentWeek = start.getTime() === currentWeekStart.getTime();

      this.setData({
        weekDays: days,
        weekTitle,
        isCurrentWeek,
        currentDate: start
      });

      // 绑定课程数据
      this.bindCourses();

      // 通知父组件周变化
      this.triggerEvent('weekchange', {
        startDate: this.formatDate(start),
        endDate: this.formatDate(endDate)
      });
    },

    /**
     * 获取某周的周一日期
     */
    getWeekStart(date) {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      d.setDate(diff);
      d.setHours(0, 0, 0, 0);
      return d;
    },

    /**
     * 格式化日期为 YYYY-MM-DD
     */
    formatDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },

    /**
     * 跳转到今天所在周
     */
    goToday() {
      const today = new Date();
      const weekStart = this.getWeekStart(today);
      this.setWeek(weekStart);
    },

    /**
     * 上一周
     */
    prevWeek() {
      const { currentDate } = this.data;
      const prev = new Date(currentDate);
      prev.setDate(prev.getDate() - 7);
      this.setWeek(prev);
    },

    /**
     * 下一周
     */
    nextWeek() {
      const { currentDate } = this.data;
      const next = new Date(currentDate);
      next.setDate(next.getDate() + 7);
      this.setWeek(next);
    },

    /**
     * 绑定课程到对应日期
     */
    bindCourses() {
      const { courses, startHour } = this.properties;
      const { weekDays, CELL_HEIGHT } = this.data;

      console.log('[schedule-grid] bindCourses called, courses:', courses.length, 'weekDays:', weekDays.length);

      if (!weekDays.length) {
        console.log('[schedule-grid] weekDays not ready, skip bindCourses');
        return;
      }

      // 清空之前的课程
      const days = weekDays.map(day => ({ ...day, courses: [] }));

      // 将课程分配到对应天
      courses.forEach(course => {
        // 找到对应的天
        const dayIndex = days.findIndex(d => d.date === course.date);
        console.log('[schedule-grid] course:', course.courseName, 'date:', course.date, 'dayIndex:', dayIndex);
        if (dayIndex === -1) return;

        // 计算课程卡片位置和高度
        const startMinutes = this.timeToMinutes(course.startTime);
        const endMinutes = this.timeToMinutes(course.endTime);
        const startOffset = startMinutes - startHour * 60;
        const duration = endMinutes - startMinutes;

        const courseWithPosition = {
          ...course,
          _top: (startOffset / 60) * CELL_HEIGHT,
          _height: (duration / 60) * CELL_HEIGHT
        };

        days[dayIndex].courses.push(courseWithPosition);
      });

      this.setData({ weekDays: days });
    },

    /**
     * 时间字符串转分钟数
     */
    timeToMinutes(timeStr) {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    },

    /**
     * 点击空白格子
     */
    onCellTap(e) {
      const { day, hour, minute } = e.currentTarget.dataset;
      const { weekDays } = this.data;
      const selectedDay = weekDays[day];

      this.triggerEvent('celltap', {
        date: selectedDay.date,
        hour,
        minute,
        dayOfWeek: selectedDay.dayOfWeek
      });
    },

    /**
     * 点击课程
     */
    onCourseTap(e) {
      this.triggerEvent('coursetap', e.detail);
    },

    /**
     * 长按课程
     */
    onCourseLongpress(e) {
      this.triggerEvent('courselongpress', e.detail);
    }
  }
});

