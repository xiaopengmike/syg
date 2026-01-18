// 绑定处理模块

/**
 * 生成 token
 */
function generateToken(userId) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2);
  return `${userId}_${timestamp}_${random}`;
}

/**
 * 绑定处理
 */
module.exports = async function bind(event, db, wxContext) {
  const { inviteCode, phone, password } = event;
  const openid = wxContext.OPENID;
  
  // 参数验证
  if (!inviteCode || !phone || !password) {
    return {
      success: false,
      code: 'INVALID_PARAMS',
      message: '参数不完整'
    };
  }
  
  try {
    // 1. 验证邀请码
    const inviteRes = await db.collection('invites').where({
      code: inviteCode,
      status: 'pending'
    }).get();
    
    if (inviteRes.data.length === 0) {
      return {
        success: false,
        code: 'INVITE_NOT_FOUND',
        message: '邀请码无效'
      };
    }
    
    const invite = inviteRes.data[0];
    
    // 检查是否过期
    if (new Date(invite.expireTime) < new Date()) {
      return {
        success: false,
        code: 'INVITE_EXPIRED',
        message: '邀请已过期'
      };
    }
    
    // 2. 检查手机号是否已被使用
    const phoneCheckRes = await db.collection('users').where({
      phone: phone,
      bindStatus: db.command.in(['bound', 'registered'])
    }).get();
    
    if (phoneCheckRes.data.length > 0) {
      return {
        success: false,
        code: 'PHONE_EXISTS',
        message: '该手机号已被使用'
      };
    }
    
    // 3. 检查 openid 是否已绑定其他账号
    const openidCheckRes = await db.collection('users').where({
      _openid: openid,
      bindStatus: db.command.in(['bound', 'registered'])
    }).get();
    
    if (openidCheckRes.data.length > 0) {
      return {
        success: false,
        code: 'ALREADY_bindable',
        message: '您已绑定其他账号'
      };
    }
    
    // 4. 更新用户记录
    const now = new Date();
    await db.collection('users').doc(invite.targetUserId).update({
      data: {
        _openid: openid,
        phone: phone,
        password: password,  // 明文存储
        bindStatus: 'bound',
        bindTime: now,
        _updateTime: now
      }
    });
    
    // 5. 更新邀请记录状态
    await db.collection('invites').doc(invite._id).update({
      data: {
        status: 'accepted',
        acceptTime: now,
        _updateTime: now
      }
    });
    
    // 6. 获取更新后的用户信息
    const userRes = await db.collection('users').doc(invite.targetUserId).get();
    const user = userRes.data;
    
    // 7. 生成 token
    const token = generateToken(user._id);
    
    return {
      success: true,
      data: {
        userId: user._id,
        openid: user._openid,
        phone: user.phone,
        role: user.role,
        name: user.name,
        avatar: user.avatar,
        subject: user.subject,
        className: user.className,
        token: token
      }
    };
  } catch (error) {
    console.error('绑定失败:', error);
    return {
      success: false,
      code: 'SYSTEM_ERROR',
      message: '系统错误，请稍后重试'
    };
  }
};





