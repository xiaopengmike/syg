/**
 * 发送邀请
 * @param {Object} event - 请求参数
 * @param {String} event.targetUserId - 目标用户ID
 * @param {Object} cloud - 云开发实例
 */
module.exports = async function invite(event, cloud) {
  const { targetUserId, openid, currentUserId } = event;
  const db = cloud.database();
  const _ = db.command;
  const usersCollection = db.collection('users');
  const invitesCollection = db.collection('invites');

  if (!targetUserId) {
    return {
      success: false,
      code: 'INVALID_PARAMS',
      message: '缺少目标用户ID'
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
        console.log('[user/invite] currentUserId查询失败:', e.message);
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
    const targetUserRes = await usersCollection.doc(targetUserId).get();
    
    if (!targetUserRes.data) {
      return {
        success: false,
        code: 'USER_NOT_FOUND',
        message: '用户不存在'
      };
    }

    const targetUser = targetUserRes.data;

    // 检查目标用户状态
    if (targetUser.bindStatus === 'bound' || targetUser.bindStatus === 'registered') {
      return {
        success: false,
        code: 'ALREADY_BOUND',
        message: '该用户已绑定账号'
      };
    }

    // 权限检查
    if (currentUser.role === 'student') {
      return {
        success: false,
        code: 'NO_PERMISSION',
        message: '无权限发送邀请'
      };
    }

    // 老师只能邀请自己创建的学生
    if (currentUser.role === 'teacher') {
      if (targetUser.role !== 'student' || targetUser.creatorId !== currentUser._id) {
        return {
          success: false,
          code: 'NO_PERMISSION',
          message: '无权限邀请该用户'
        };
      }
    }

    // 生成邀请码（6位字母数字）
    const code = generateInviteCode();
    
    // 设置过期时间（7天后）
    const now = new Date();
    const expireTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // 使旧邀请失效
    await invitesCollection.where({
      targetUserId,
      status: 'pending'
    }).update({
      data: {
        status: 'cancelled',
        updatedAt: now
      }
    });

    // 创建新邀请
    const inviteData = {
      code,
      inviterId: currentUser._id,
      inviterName: currentUser.name,
      inviterRole: currentUser.role,
      targetUserId,
      targetName: targetUser.name,
      targetRole: targetUser.role,
      status: 'pending',
      expireTime,
      createdAt: now,
      updatedAt: now
    };

    await invitesCollection.add({ data: inviteData });

    // 更新目标用户状态
    await usersCollection.doc(targetUserId).update({
      data: {
        bindStatus: 'pending',
        updatedAt: now
      }
    });

    return {
      success: true,
      message: '邀请已发送',
      data: {
        code,
        expireTime: expireTime.toISOString()
      }
    };

  } catch (error) {
    console.error('发送邀请失败:', error);
    return {
      success: false,
      code: 'INVITE_ERROR',
      message: '发送邀请失败'
    };
  }
};

/**
 * 生成6位邀请码
 */
function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';  // 去掉容易混淆的字符
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}





