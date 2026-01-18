/**
 * 添加用户记录
 * @param {Object} event - 请求参数
 * @param {String} event.role - 角色 (teacher/student)
 * @param {String} event.name - 姓名
 * @param {String} event.subject - 科目（老师）
 * @param {String} event.className - 班级（学生）
 * @param {String} event.remark - 备注
 * @param {Object} cloud - 云开发实例
 */
module.exports = async function add(event, cloud) {
  const { role, name, subject, remark, openid, currentUserId } = event;
  const db = cloud.database();
  const _ = db.command;
  const usersCollection = db.collection('users');

  // 参数验证
  if (!role || !['teacher', 'student'].includes(role)) {
    return {
      success: false,
      code: 'INVALID_ROLE',
      message: '请选择有效的角色'
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
    let currentUser;

    // 优先使用前端传递的 currentUserId
    if (currentUserId) {
      try {
        const userRes = await usersCollection.doc(currentUserId).get();
        if (userRes.data) {
          currentUser = userRes.data;
        }
      } catch (e) {
        console.log('[user/add] currentUserId查询失败:', e.message);
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

    // 权限检查
    if (currentUser.role === 'student') {
      return {
        success: false,
        code: 'NO_PERMISSION',
        message: '无权限添加用户'
      };
    }

    // 老师只能添加学生
    if (currentUser.role === 'teacher' && role !== 'student') {
      return {
        success: false,
        code: 'NO_PERMISSION',
        message: '老师只能添加学生'
      };
    }

    // 创建用户记录
    const now = new Date();
    const userData = {
      name,
      role,
      subject: role === 'teacher' ? (subject || '') : '',
      remark: remark || '',
      bindStatus: 'unbound',  // 待绑定
      creatorId: currentUser._id,
      creatorName: currentUser.name,
      phone: null,
      password: null,
      _openid: null,
      createdAt: now,
      updatedAt: now
    };

    const result = await usersCollection.add({ data: userData });

    // 创建关系记录（可选）
    // await db.collection('relations').add({
    //   data: {
    //     fromUserId: currentUser._id,
    //     toUserId: result._id,
    //     relationType: currentUser.role === 'principal' ? 'manage' : 'teach',
    //     createdAt: now
    //   }
    // });

    return {
      success: true,
      message: '添加成功',
      data: {
        userId: result._id
      }
    };

  } catch (error) {
    console.error('添加用户失败:', error);
    return {
      success: false,
      code: 'ADD_ERROR',
      message: '添加失败'
    };
  }
};





