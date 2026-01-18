/**
 * 用户自主注册
 * @param {Object} event - 请求参数
 * @param {String} event.role - 角色 (teacher/student)
 * @param {String} event.phone - 手机号
 * @param {String} event.password - 密码
 * @param {String} event.name - 姓名
 * @param {String} event.subject - 科目（老师）
 * @param {String} event.className - 班级（学生）
 * @param {Object} cloud - 云开发实例
 */
module.exports = async function register(event, cloud) {
  const { role, phone, password, name, subject, className } = event;
  const db = cloud.database();
  const usersCollection = db.collection('users');

  // 参数验证
  if (!role || !['teacher', 'student'].includes(role)) {
    return {
      success: false,
      code: 'INVALID_ROLE',
      message: '请选择有效的角色'
    };
  }

  if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
    return {
      success: false,
      code: 'INVALID_PHONE',
      message: '请输入正确的手机号'
    };
  }

  if (!password || password.length < 6) {
    return {
      success: false,
      code: 'INVALID_PASSWORD',
      message: '密码至少6位'
    };
  }

  if (!name || name.length < 2) {
    return {
      success: false,
      code: 'INVALID_NAME',
      message: '姓名至少2个字'
    };
  }

  try {
    // 检查手机号是否已注册
    const existingUser = await usersCollection
      .where({ phone })
      .get();

    if (existingUser.data && existingUser.data.length > 0) {
      return {
        success: false,
        code: 'PHONE_EXISTS',
        message: '该手机号已注册'
      };
    }

    // 生成简单的 token（实际项目应使用 JWT）
    const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 创建用户记录
    const now = new Date();
    const userData = {
      phone,
      password,
      name,
      role,
      subject: role === 'teacher' ? (subject || '') : '',
      className: role === 'student' ? (className || '') : '',
      bindStatus: 'registered',  // 自主注册的用户
      creatorId: null,           // 无创建者
      token,
      createdAt: now,
      updatedAt: now
    };

    const result = await usersCollection.add({ data: userData });

    // 返回用户信息（不包含密码）
    return {
      success: true,
      message: '注册成功',
      data: {
        _id: result._id,       // 用户ID
        userId: result._id,    // 兼容旧代码
        phone,
        name,
        role,
        subject: userData.subject,
        className: userData.className,
        bindStatus: 'registered',
        token
      }
    };

  } catch (error) {
    console.error('注册失败:', error);
    return {
      success: false,
      code: 'REGISTER_ERROR',
      message: '注册失败，请稍后重试'
    };
  }
};




