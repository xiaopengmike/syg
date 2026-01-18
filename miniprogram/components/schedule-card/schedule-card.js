// components/schedule-card/schedule-card.js

Component({
  properties: {
    // 课程数据
    course: {
      type: Object,
      value: {}
    },
    // 是否显示时间
    showTime: {
      type: Boolean,
      value: false
    }
  },

  methods: {
    /**
     * 点击卡片
     */
    handleTap() {
      this.triggerEvent('cardtap', { course: this.properties.course });
    },

    /**
     * 长按卡片
     */
    handleLongpress() {
      this.triggerEvent('cardlongpress', { course: this.properties.course });
    }
  }
});

