/**
 * 权限验证模块
 */

// 角色常量
const ROLES = {
  PRINCIPAL: 'principal',  // 校长
  TEACHER: 'teacher',      // 老师
  STUDENT: 'student'       // 学生
};

// 角色显示名称
const ROLE_NAMES = {
  [ROLES.PRINCIPAL]: '校长',
  [ROLES.TEACHER]: '老师',
  [ROLES.STUDENT]: '学生'
};

// 角色权限配置
const ROLE_PERMISSIONS = {
  [ROLES.PRINCIPAL]: [
    'schedule:create',
    'schedule:edit',
    'schedule:delete',
    'schedule:view',
    'invite:teacher',
    'invite:student',
    'user:manage',
    'conflict:view'
  ],
  [ROLES.TEACHER]: [
    'schedule:create',
    'schedule:edit',
    'schedule:view',
    'invite:student',
    'conflict:view'
  ],
  [ROLES.STUDENT]: [
    'schedule:view'
  ]
};

/**
 * 获取当前用户信息
 * @returns {Object|null}
 */
function getCurrentUser() {
  const app = getApp();
  return app.globalData.userInfo;
}

/**
 * 检查是否已登录
 * @returns {Boolean}
 */
function isLoggedIn() {
  const app = getApp();
  return app.globalData.isLoggedIn;
}

/**
 * 获取当前用户角色
 * @returns {String|null}
 */
function getCurrentRole() {
  const user = getCurrentUser();
  return user?.role || null;
}

/**
 * 检查是否是某个角色
 * @param {String} role 角色标识
 * @returns {Boolean}
 */
function isRole(role) {
  return getCurrentRole() === role;
}

/**
 * 检查是否是校长
 * @returns {Boolean}
 */
function isPrincipal() {
  return isRole(ROLES.PRINCIPAL);
}

/**
 * 检查是否是老师
 * @returns {Boolean}
 */
function isTeacher() {
  return isRole(ROLES.TEACHER);
}

/**
 * 检查是否是学生
 * @returns {Boolean}
 */
function isStudent() {
  return isRole(ROLES.STUDENT);
}

/**
 * 检查是否有某个权限
 * @param {String} permission 权限标识
 * @returns {Boolean}
 */
function hasPermission(permission) {
  const role = getCurrentRole();
  if (!role) return false;
  
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

/**
 * 检查是否可以邀请某个角色
 * @param {String} targetRole 目标角色
 * @returns {Boolean}
 */
function canInvite(targetRole) {
  const currentRole = getCurrentRole();
  
  if (currentRole === ROLES.PRINCIPAL) {
    // 校长可以邀请老师和学生
    return targetRole === ROLES.TEACHER || targetRole === ROLES.STUDENT;
  }
  
  if (currentRole === ROLES.TEACHER) {
    // 老师只能邀请学生
    return targetRole === ROLES.STUDENT;
  }
  
  return false;
}

/**
 * 需要登录的页面守卫
 * @param {Function} callback 登录后的回调
 */
function requireLogin(callback) {
  if (isLoggedIn()) {
    callback && callback();
  } else {
    wx.showModal({
      title: '提示',
      content: '请先登录',
      confirmText: '去登录',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: '/pages/login/login'
          });
        }
      }
    });
  }
}

/**
 * 需要某个权限的页面守卫
 * @param {String} permission 权限标识
 * @param {Function} callback 有权限后的回调
 */
function requirePermission(permission, callback) {
  if (!isLoggedIn()) {
    requireLogin();
    return;
  }
  
  if (hasPermission(permission)) {
    callback && callback();
  } else {
    wx.showToast({
      title: '暂无权限',
      icon: 'none'
    });
  }
}

/**
 * 获取角色显示名称
 * @param {String} role 角色标识
 * @returns {String}
 */
function getRoleName(role) {
  return ROLE_NAMES[role] || '未知';
}

/**
 * 等待 app 初始化完成后检查登录状态
 * 解决页面 onLoad 可能在 app.onLaunch 之前执行的时序问题
 * @param {Function} callback 已登录时的回调
 * @param {Function} onNotLogin 未登录时的回调，不传则使用默认的 requireLogin
 */
function checkLoginWithReady(callback, onNotLogin) {
  const app = getApp();
  app.onReady(() => {
    if (app.globalData.isLoggedIn) {
      callback && callback();
    } else {
      if (onNotLogin) {
        onNotLogin();
      } else {
        requireLogin();
      }
    }
  });
}

module.exports = {
  ROLES,
  ROLE_NAMES,
  ROLE_PERMISSIONS,
  getCurrentUser,
  isLoggedIn,
  getCurrentRole,
  isRole,
  isPrincipal,
  isTeacher,
  isStudent,
  hasPermission,
  canInvite,
  requireLogin,
  requirePermission,
  getRoleName,
  checkLoginWithReady
};





