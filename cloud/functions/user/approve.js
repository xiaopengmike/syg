/**
 * 审批学生注册
 * @param {Object} event - 请求参数
 * @param {String} event.targetUserId - 待审批的学生ID
 * @param {String} event.action - 操作类型 (approve/reject)
 * @param {String} event.currentUserId - 当前操作用户ID
 * @param {Object} cloud - 云开发实例
 */
module.exports = async function approve(event, cloud) {
  const { targetUserId, action, currentUserId, openid } = event;
  const db = cloud.database();
  const usersCollection = db.collection('users');

  // 参数验证
  if (!targetUserId) {
    return {
      success: false,
      code: 'INVALID_PARAMS',
      message: '缺少学生ID'
    };
  }

  if (!action || !['approve', 'reject'].includes(action)) {
    return {
      success: false,
      code: 'INVALID_ACTION',
      message: '无效的操作类型'
    };
  }

  try {
    // 获取当前操作用户信息
    let currentUser;
    
    if (currentUserId) {
      try {
        const userRes = await usersCollection.doc(currentUserId).get();
        if (userRes.data) {
          currentUser = userRes.data;
        }
      } catch (e) {
        console.log('[approve] currentUserId查询失败:', e.message);
      }
    }

    // 如果没有 currentUserId 或查询失败，回退到 openid 查询
    if (!currentUser && openid) {
      const userRes = await usersCollection.where({
        _openid: openid
      }).get();

      if (userRes.data.length > 0) {
        currentUser = userRes.data[0];
      }
    }

    // 检查是否登录
    if (!currentUser) {
      return {
        success: false,
        code: 'NOT_LOGGED_IN',
        message: '请先登录'
      };
    }

    // 检查权限（只有校长可以审批）
    if (currentUser.role !== 'principal') {
      return {
        success: false,
        code: 'NO_PERMISSION',
        message: '只有校长可以审批学生注册'
      };
    }

    // 获取目标学生信息
    let targetUser;
    try {
      const targetRes = await usersCollection.doc(targetUserId).get();
      targetUser = targetRes.data;
    } catch (e) {
      return {
        success: false,
        code: 'USER_NOT_FOUND',
        message: '学生不存在'
      };
    }

    // 验证目标用户状态
    if (targetUser.role !== 'student') {
      return {
        success: false,
        code: 'INVALID_TARGET',
        message: '只能审批学生注册'
      };
    }

    if (targetUser.bindStatus !== 'pending_approval') {
      return {
        success: false,
        code: 'INVALID_STATUS',
        message: '该学生不在待审批状态'
      };
    }

    const now = new Date();

    if (action === 'approve') {
      // 批准注册
      const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await usersCollection.doc(targetUserId).update({
        data: {
          bindStatus: 'registered',
          token,
          approvedBy: currentUser._id,
          approvedAt: now,
          updatedAt: now
        }
      });

      return {
        success: true,
        message: '已批准该学生注册'
      };
    } else {
      // 拒绝注册
      await usersCollection.doc(targetUserId).update({
        data: {
          bindStatus: 'rejected',
          rejectedBy: currentUser._id,
          rejectedAt: now,
          updatedAt: now
        }
      });

      return {
        success: true,
        message: '已拒绝该学生注册'
      };
    }

  } catch (error) {
    console.error('审批失败:', error);
    return {
      success: false,
      code: 'APPROVE_ERROR',
      message: '审批失败，请稍后重试'
    };
  }
};
