// 登录处理模块

/**
 * 生成 token
 */
function generateToken(userId) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2);
  return `${userId}_${timestamp}_${random}`;
}

/**
 * 登录处理
 */
module.exports = async function login(event, db) {
  const { phone, password } = event;
  
  // 参数验证
  if (!phone || !password) {
    return {
      success: false,
      code: 'INVALID_PARAMS',
      message: '手机号和密码不能为空'
    };
  }
  
  try {
    console.log('[user/login] 查询用户, phone:', phone);
    
    // 查询用户（不限制bindStatus，只要phone匹配且有密码即可）
    const userRes = await db.collection('users').where({
      phone: phone
    }).get();
    
    console.log('[user/login] 查询结果:', {
      count: userRes.data.length,
      users: userRes.data.map(u => ({
        _id: u._id,
        phone: u.phone,
        bindStatus: u.bindStatus,
        name: u.name,
        hasPassword: !!u.password
      }))
    });
    
    if (userRes.data.length === 0) {
      return {
        success: false,
        code: 'USER_NOT_FOUND',
        message: 'ID不存在'
      };
    }
    
    // 如果有多个匹配的用户，选择第一个有密码的
    let user = userRes.data.find(u => u.password) || userRes.data[0];
    
    // 如果用户没有密码，说明还未设置，不能登录
    if (!user.password) {
      return {
        success: false,
        code: 'NO_PASSWORD',
        message: '该ID尚未设置密码，请先完成绑定或注册'
      };
    }
    
    // 验证密码（明文比对）
    if (password !== user.password) {
      return {
        success: false,
        code: 'WRONG_PASSWORD',
        message: '密码错误'
      };
    }
    
    // 生成 token
    const token = generateToken(user._id);
    
    // 更新最后登录时间和 openid
    const updateData = {
      lastLoginTime: new Date(),
      _updateTime: new Date()
    };
    
    // 如果用户没有绑定 openid，则绑定当前登录的 openid
    if (!user._openid && event.openid) {
      updateData._openid = event.openid;
    }
    
    await db.collection('users').doc(user._id).update({
      data: updateData
    });
    
    return {
      success: true,
      data: {
        _id: user._id,        // 用户ID
        userId: user._id,     // 兼容旧代码
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
    console.error('登录失败:', error);
    return {
      success: false,
      code: 'SYSTEM_ERROR',
      message: '系统错误，请稍后重试'
    };
  }
};

