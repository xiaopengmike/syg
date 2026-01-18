/**
 * 获取用户详情
 * @param {Object} event - 请求参数
 * @param {String} event.userId - 用户ID
 * @param {Object} cloud - 云开发实例
 */
module.exports = async function detail(event, cloud) {
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
        console.log('[user/detail] currentUserId查询失败:', e.message);
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
    const userRes = await usersCollection.doc(userId).get();
    
    if (!userRes.data) {
      return {
        success: false,
        code: 'USER_NOT_FOUND',
        message: '用户不存在'
      };
    }

    const user = userRes.data;

    // 获取创建者信息
    if (user.creatorId) {
      const creatorRes = await usersCollection.doc(user.creatorId).get();
      if (creatorRes.data) {
        user.creatorName = creatorRes.data.name;
      }
    } else if (user.role !== 'principal') {
      // 如果没有 creatorId 且不是校长，可能是系统初始化或旧数据
      user.creatorName = '系统管理员';
    }

    // 权限检查
    if (currentUser.role === 'student') {
      return {
        success: false,
        code: 'NO_PERMISSION',
        message: '无权限查看'
      };
    }

    // 老师只能查看自己创建的学生
    if (currentUser.role === 'teacher') {
      if (user.role !== 'student' || user.creatorId !== currentUser._id) {
        return {
          success: false,
          code: 'NO_PERMISSION',
          message: '无权限查看'
        };
      }
    }

    // 获取邀请信息（如果有）
    let inviteInfo = null;
    if (user.bindStatus === 'pending') {
      const inviteRes = await invitesCollection.where({
        targetUserId: userId,
        status: 'pending'
      }).orderBy('createdAt', 'desc').limit(1).get();

      if (inviteRes.data.length > 0) {
        inviteInfo = inviteRes.data[0];
      }
    }

    return {
      success: true,
      data: {
        user,
        inviteInfo
      }
    };

  } catch (error) {
    console.error('获取用户详情失败:', error);
    return {
      success: false,
      code: 'DETAIL_ERROR',
      message: '获取详情失败'
    };
  }
};





