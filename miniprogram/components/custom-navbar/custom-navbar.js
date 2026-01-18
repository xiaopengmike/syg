Component({
  options: {
    multipleSlots: true
  },
  properties: {
    title: {
      type: String,
      value: '课程系统'
    },
    showBack: {
      type: Boolean,
      value: true
    },
    delta: {
      type: Number,
      value: 1
    }
  },
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    menuButtonInfo: null
  },
  lifetimes: {
    attached() {
      this.initNavBar()
    }
  },
  methods: {
    initNavBar() {
      try {
        const systemInfo = wx.getSystemInfoSync()
        const menuButtonInfo = wx.getMenuButtonBoundingClientRect()
        
        const statusBarHeight = systemInfo.statusBarHeight || 20
        const navBarHeight = (menuButtonInfo.top - statusBarHeight) * 2 + menuButtonInfo.height
        
        this.setData({
          statusBarHeight,
          navBarHeight,
          menuButtonInfo
        })
      } catch (e) {
        console.error('获取导航栏信息失败', e)
        this.setData({
          statusBarHeight: 20,
          navBarHeight: 44
        })
      }
    },
    handleBack() {
      const pages = getCurrentPages()
      if (pages.length > 1) {
        wx.navigateBack({
          delta: this.data.delta
        })
      } else {
        wx.switchTab({
          url: '/pages/index/index'
        })
      }
    }
  }
})
