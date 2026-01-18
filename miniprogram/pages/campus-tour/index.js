// pages/campus-tour/index.js
Page({
  data: {
    campusInfo: {
      name: '课程培训中心',
      address: '请联系校方获取详细地址',
      phone: '请联系校方',
      description: '我们提供专业的课程培训服务，拥有优质的教学环境和经验丰富的师资团队。'
    },
    facilities: [
      { icon: '🏢', name: '教学楼', desc: '现代化教学设施' },
      { icon: '📚', name: '图书室', desc: '丰富的学习资料' },
      { icon: '🎨', name: '活动室', desc: '多功能活动空间' },
      { icon: '🅿️', name: '停车场', desc: '便捷的停车服务' }
    ],
    gallery: []
  },

  onLoad() {
    // 页面加载时可以从云端获取校区信息
  },

  /**
   * 拨打电话
   */
  makePhoneCall() {
    wx.showToast({
      title: '请联系校方获取联系方式',
      icon: 'none'
    });
  },

  /**
   * 查看地图
   */
  openMap() {
    wx.showToast({
      title: '请联系校方获取详细地址',
      icon: 'none'
    });
  },

  /**
   * 预览图片
   */
  previewImage(e) {
    const { url } = e.currentTarget.dataset;
    if (this.data.gallery.length > 0) {
      wx.previewImage({
        current: url,
        urls: this.data.gallery.map(item => item.url)
      });
    }
  }
});
