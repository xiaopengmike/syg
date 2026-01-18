// pages/course-intro/index.js
Page({
  data: {
    courseCategories: [
      {
        id: 'language',
        name: '语言类',
        icon: '🗣️',
        courses: [
          { name: '英语', desc: '听说读写全面提升', tags: ['口语', '阅读', '写作'] },
          { name: '语文', desc: '阅读写作能力培养', tags: ['阅读', '作文', '古诗词'] }
        ]
      },
      {
        id: 'stem',
        name: '理科类',
        icon: '🔬',
        courses: [
          { name: '数学', desc: '逻辑思维能力培养', tags: ['计算', '几何', '应用题'] },
          { name: '物理', desc: '科学探索与实验', tags: ['力学', '电学', '实验'] },
          { name: '化学', desc: '物质变化的奥秘', tags: ['元素', '反应', '实验'] }
        ]
      },
      {
        id: 'arts',
        name: '艺术类',
        icon: '🎨',
        courses: [
          { name: '美术', desc: '创意绘画与设计', tags: ['素描', '水彩', '创意'] },
          { name: '音乐', desc: '声乐与器乐培训', tags: ['钢琴', '声乐', '乐理'] }
        ]
      },
      {
        id: 'sports',
        name: '体育类',
        icon: '⚽',
        courses: [
          { name: '篮球', desc: '团队协作运动', tags: ['技巧', '体能', '比赛'] },
          { name: '游泳', desc: '健康水上运动', tags: ['泳姿', '安全', '竞技'] }
        ]
      }
    ],
    expandedCategory: ''
  },

  onLoad() {
    // 默认展开第一个分类
    if (this.data.courseCategories.length > 0) {
      this.setData({
        expandedCategory: this.data.courseCategories[0].id
      });
    }
  },

  /**
   * 切换分类展开状态
   */
  toggleCategory(e) {
    const { id } = e.currentTarget.dataset;
    this.setData({
      expandedCategory: this.data.expandedCategory === id ? '' : id
    });
  },

  /**
   * 查看课程详情
   */
  viewCourseDetail(e) {
    const { name } = e.currentTarget.dataset;
    wx.showToast({
      title: `${name}课程详情即将上线`,
      icon: 'none'
    });
  },

  /**
   * 咨询报名
   */
  consultCourse() {
    wx.showModal({
      title: '咨询报名',
      content: '如需了解更多课程信息或报名，请联系校方获取详细信息。',
      showCancel: false,
      confirmText: '我知道了'
    });
  }
});
