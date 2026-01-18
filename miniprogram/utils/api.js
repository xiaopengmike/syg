/**
 * API 封装模块
 * 统一云函数调用和错误处理
 */

/**
 * 调用云函数
 * @param {String} name 云函数名称
 * @param {String} action 操作类型
 * @param {Object} data 请求数据
 * @returns {Promise}
 */
async function callCloudFunction(name, action, data = {}) {
  try {
    const res = await wx.cloud.callFunction({
      name,
      data: {
        action,
        ...data
      }
    });

    // 云函数调用成功，检查业务状态
    if (res.result && res.result.success) {
      return res.result;
    } else {
      // 业务错误
      const error = new Error(res.result?.message || '操作失败');
      error.code = res.result?.code || 'UNKNOWN_ERROR';
      error.data = res.result?.data;
      throw error;
    }
  } catch (error) {
    console.error(`[API] ${name}/${action} 调用失败:`, error);
    
    // 统一错误提示
    if (!error.code) {
      error.code = 'NETWORK_ERROR';
      error.message = '网络请求失败，请稍后重试';
    }
    
    throw error;
  }
}

/**
 * 显示加载中
 * @param {String} title 提示文字
 */
function showLoading(title = '加载中...') {
  wx.showLoading({
    title,
    mask: true
  });
}

/**
 * 隐藏加载中
 */
function hideLoading() {
  wx.hideLoading();
}

/**
 * 显示成功提示
 * @param {String} title 提示文字
 */
function showSuccess(title = '操作成功') {
  wx.showToast({
    title,
    icon: 'success',
    duration: 2000
  });
}

/**
 * 显示错误提示
 * @param {String} title 提示文字
 */
function showError(title = '操作失败') {
  wx.showToast({
    title,
    icon: 'error',
    duration: 2000
  });
}

/**
 * 显示提示信息
 * @param {String} title 提示文字
 */
function showToast(title) {
  wx.showToast({
    title,
    icon: 'none',
    duration: 2000
  });
}

/**
 * 显示确认弹窗
 * @param {String} title 标题
 * @param {String} content 内容
 * @returns {Promise<Boolean>}
 */
function showConfirm(title, content) {
  return new Promise((resolve) => {
    wx.showModal({
      title,
      content,
      success: (res) => {
        resolve(res.confirm);
      }
    });
  });
}

// ===== 业务 API =====

/**
 * 用户相关 API
 */
const userApi = {
  /**
   * 登录
   * @param {String} phone 手机号
   * @param {String} password 密码
   */
  login(phone, password) {
    return callCloudFunction('user', 'login', { phone, password });
  },

  /**
   * 注册
   * @param {Object} data { phone, password, role, name }
   */
  register(data) {
    return callCloudFunction('user', 'register', data);
  },

  /**
   * 获取手机号
   * @param {String} code 手机号获取凭证
   */
  getPhone(code) {
    return callCloudFunction('user', 'getPhone', { code });
  },

  /**
   * 获取用户信息
   */
  getUserInfo() {
    return callCloudFunction('user', 'getUserInfo');
  }
};

/**
 * 邀请相关 API (通过 user 云函数)
 */
const inviteApi = {
  /**
   * 创建邀请
   * @param {String} inviteeRole 被邀请人角色
   * @param {Number} expireDays 过期天数
   */
  create(inviteeRole, expireDays = 7) {
    return callCloudFunction('user', 'invite', { inviteeRole, expireDays });
  },

  /**
   * 获取邀请信息
   * @param {String} code 邀请码
   */
  getInfo(code) {
    return callCloudFunction('user', 'getInviteInfo', { code });
  },

  /**
   * 绑定邀请
   * @param {String} inviteCode 邀请码
   * @param {String} phone 手机号
   * @param {String} password 密码
   */
  bind(inviteCode, phone, password) {
    return callCloudFunction('user', 'bind', { inviteCode, phone, password });
  }
};

/**
 * 排课相关 API
 */
const scheduleApi = {
  /**
   * 创建排课
   * @param {Object} data 排课数据
   */
  create(data) {
    return callCloudFunction('schedule', 'create', data);
  },

  /**
   * 更新排课
   * @param {String} scheduleId 排课ID
   * @param {Object} data 更新数据
   */
  update(scheduleId, data) {
    return callCloudFunction('schedule', 'update', { scheduleId, ...data });
  },

  /**
   * 删除排课
   * @param {String} scheduleId 排课ID
   */
  delete(scheduleId) {
    return callCloudFunction('schedule', 'delete', { scheduleId });
  },

  /**
   * 获取排课列表
   * @param {Object} params 查询参数
   */
  list(params = {}) {
    return callCloudFunction('schedule', 'list', params);
  },

  /**
   * 获取排课详情
   * @param {String} scheduleId 排课ID
   */
  detail(scheduleId) {
    return callCloudFunction('schedule', 'detail', { scheduleId });
  }
};

/**
 * 冲突检测 API (冲突检测已集成到 schedule/create 和 schedule/update)
 * 创建/更新课程时会自动检测冲突
 */
const conflictApi = {
  // 冲突检测已集成到课程创建/更新流程中
  // 不需要单独的冲突检测API
};

module.exports = {
  callCloudFunction,
  showLoading,
  hideLoading,
  showSuccess,
  showError,
  showToast,
  showConfirm,
  userApi,
  inviteApi,
  scheduleApi,
  conflictApi
};





