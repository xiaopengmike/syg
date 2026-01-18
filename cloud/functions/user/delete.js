/**
 * 删除用户
 * @param {Object} event - 请求参数
 * @param {String} event.userId - 用户ID
 * @param {Object} cloud - 云开发实例
 */
module.exports = async function deleteUser(event, cloud) {
  const { userId, openid, currentUserId } = event;
  const db = cloud.database();
  const _ = db.command;
  const usersCollection = db.collection('users');
  const invitesCollection = db.collection('invites');

  if (!userId) {
    return {
      success: false,
      code: 'INVALID_PARAMS',
      message: '缺少用户ID'
    };
  }

  try {
    let currentUser;

    // 优先使用前端传递的 currentUserId
    if (currentUserId) {
      try {
        const userRes = await usersCollection.doc(currentUserId).get();
        if (userRes.data) {
          currentUser = userRes.data;
        }
      } catch (e) {
        console.log('[user/delete] currentUserId查询失败:', e.message);
      }
    }

    // 回退到 openid 查询
    if (!currentUser && openid) {
      const currentUserRes = await usersCollection.where({
        _openid: openid
      }).get();
      if (currentUserRes.data.length > 0) {
        currentUser = currentUserRes.data[0];
      }
    }

    if (!currentUser) {
      return {
        success: false,
        code: 'NOT_LOGGED_IN',
        message: '请先登录'
      };
    }

    // 获取目标用户信息
    const targetUserRes = await usersCollection.doc(userId).get();
    
    if (!targetUserRes.data) {
      return {
        success: false,
        code: 'USER_NOT_FOUND',
        message: '用户不存在'
      };
    }

    const targetUser = targetUserRes.data;

    // 只能删除未绑定的用户
    if (targetUser.bindStatus !== 'unbound') {
      return {
        success: false,
        code: 'CANNOT_DELETE',
        message: '只能删除未绑定的用户'
      };
    }

    // 权限检查
    if (currentUser.role === 'student') {
      return {
        success: false,
        code: 'NO_PERMISSION',
        message: '无权限删除'
      };
    }

    // 老师只能删除自己创建的学生
    if (currentUser.role === 'teacher') {
      if (targetUser.role !== 'student' || targetUser.creatorId !== currentUser._id) {
        return {
          success: false,
          code: 'NO_PERMISSION',
          message: '无权限删除该用户'
        };
      }
    }

    // 删除相关邀请
    await invitesCollection.where({
      targetUserId: userId
    }).remove();

    // 删除用户
    await usersCollection.doc(userId).remove();

    return {
      success: true,
      message: '删除成功'
    };

  } catch (error) {
    console.error('删除用户失败:', error);
    return {
      success: false,
      code: 'DELETE_ERROR',
      message: '删除失败'
    };
  }
};





