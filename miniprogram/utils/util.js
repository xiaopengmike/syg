/**
 * 通用工具函数
 */

/**
 * 格式化日期
 * @param {Date|String|Number} date 日期
 * @param {String} format 格式 YYYY-MM-DD HH:mm:ss
 * @returns {String}
 */
function formatDate(date, format = 'YYYY-MM-DD') {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * 格式化时间（HH:mm）
 * @param {String} time 时间字符串
 * @returns {String}
 */
function formatTime(time) {
  if (!time) return '';
  
  // 如果已经是 HH:mm 格式，直接返回
  if (/^\d{2}:\d{2}$/.test(time)) {
    return time;
  }
  
  // 尝试解析为日期
  const d = new Date(time);
  if (!isNaN(d.getTime())) {
    return formatDate(d, 'HH:mm');
  }
  
  return time;
}

/**
 * 获取星期几的显示文字
 * @param {Number} dayOfWeek 1-7
 * @returns {String}
 */
function getDayOfWeekText(dayOfWeek) {
  const days = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  return days[dayOfWeek] || '';
}

/**
 * 获取本周的起始日期
 * @param {Date} date 参考日期
 * @returns {Date}
 */
function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 周一为起始
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * 获取本周的结束日期
 * @param {Date} date 参考日期
 * @returns {Date}
 */
function getWeekEnd(date = new Date()) {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * 获取一周的日期数组
 * @param {Date} weekStart 周起始日期
 * @returns {Array}
 */
function getWeekDates(weekStart) {
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    dates.push({
      date,
      dateStr: formatDate(date, 'MM-DD'),
      dayOfWeek: i + 1,
      dayText: getDayOfWeekText(i + 1),
      isToday: isToday(date)
    });
  }
  return dates;
}

/**
 * 判断是否是今天
 * @param {Date} date 日期
 * @returns {Boolean}
 */
function isToday(date) {
  const today = new Date();
  return formatDate(date, 'YYYY-MM-DD') === formatDate(today, 'YYYY-MM-DD');
}

/**
 * 生成唯一ID
 * @returns {String}
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * 生成随机邀请码（6位字母数字）
 * @returns {String}
 */
function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * 深拷贝
 * @param {Any} obj 对象
 * @returns {Any}
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item));
  }
  
  const cloned = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

/**
 * 防抖
 * @param {Function} fn 函数
 * @param {Number} delay 延迟毫秒
 * @returns {Function}
 */
function debounce(fn, delay = 300) {
  let timer = null;
  return function(...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

/**
 * 节流
 * @param {Function} fn 函数
 * @param {Number} interval 间隔毫秒
 * @returns {Function}
 */
function throttle(fn, interval = 300) {
  let lastTime = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastTime >= interval) {
      lastTime = now;
      fn.apply(this, args);
    }
  };
}

/**
 * 比较两个时间字符串
 * @param {String} time1 HH:mm
 * @param {String} time2 HH:mm
 * @returns {Number} -1, 0, 1
 */
function compareTime(time1, time2) {
  const [h1, m1] = time1.split(':').map(Number);
  const [h2, m2] = time2.split(':').map(Number);
  
  const minutes1 = h1 * 60 + m1;
  const minutes2 = h2 * 60 + m2;
  
  if (minutes1 < minutes2) return -1;
  if (minutes1 > minutes2) return 1;
  return 0;
}

/**
 * 计算时间差（分钟）
 * @param {String} startTime HH:mm
 * @param {String} endTime HH:mm
 * @returns {Number}
 */
function getTimeDiff(startTime, endTime) {
  const [h1, m1] = startTime.split(':').map(Number);
  const [h2, m2] = endTime.split(':').map(Number);
  
  return (h2 * 60 + m2) - (h1 * 60 + m1);
}

module.exports = {
  formatDate,
  formatTime,
  getDayOfWeekText,
  getWeekStart,
  getWeekEnd,
  getWeekDates,
  isToday,
  generateId,
  generateInviteCode,
  deepClone,
  debounce,
  throttle,
  compareTime,
  getTimeDiff
};





