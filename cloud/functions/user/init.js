/**
 * 初始化默认用户数据
 * @param {Object} event - 请求参数
 * @param {Object} cloud - 云开发实例
 */
module.exports = async function init(event, cloud) {
  const db = cloud.database();
  const usersCollection = db.collection('users');
  const _ = db.command;

  // 默认用户数据
  const DEFAULT_USERS = [
    {
      phone: '18871458537',
      password: '123456',
      name: 'Judy校长',
      role: 'principal',  // 校长角色
      subject: '',
      className: '',
      bindStatus: 'registered',
      isAdmin: true  // 管理员
    },

    {
      phone: '17665388801',
      password: '123456',
      name: 'Michael老师',
      role: 'teacher',
      subject: '数学',
      className: '',
      bindStatus: 'registered',
      isAdmin: false
    },
    {
      phone: '17665388802',
      password: '123456',
      name: '肖老师',
      role: 'teacher',
      subject: '语文',
      className: '',
      bindStatus: 'registered',
      isAdmin: false
    },
    {
      phone: '13800138001',
      password: '123456',
      name: '张小明',
      role: 'student',
      subject: '',
      className: '三年级一班',
      bindStatus: 'registered',
      isAdmin: false
    },
    {
      phone: '123456',
      password: '123456',
      name: '测试老师',
      role: 'teacher',
      subject: '',
      className: '',
      bindStatus: 'registered',
      isAdmin: false
    }
  ];

  const results = {
    created: [],
    updated: [],
    skipped: [],
    errors: []
  };

  try {
    for (const userData of DEFAULT_USERS) {
      try {
        // 检查用户是否已存在
        const existingUser = await usersCollection
          .where({ phone: userData.phone })
          .get();

        const now = new Date();

        if (existingUser.data && existingUser.data.length > 0) {
          // 用户已存在，更新信息
          const userId = existingUser.data[0]._id;
          await usersCollection.doc(userId).update({
            data: {
              password: userData.password,
              name: userData.name,
              role: userData.role,
              subject: userData.subject,
              className: userData.className,
              isAdmin: userData.isAdmin || false,
              updatedAt: now
            }
          });
          results.updated.push({
            phone: userData.phone,
            name: userData.name,
            role: userData.role
          });
        } else {
          // 创建新用户
          const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await usersCollection.add({
            data: {
              ...userData,
              token,
              creatorId: null,
              createdAt: now,
              updatedAt: now
            }
          });
          results.created.push({
            phone: userData.phone,
            name: userData.name,
            role: userData.role
          });
        }
      } catch (err) {
        results.errors.push({
          phone: userData.phone,
          error: err.message
        });
      }
    }

    return {
      success: true,
      message: '初始化完成',
      data: results,
      summary: {
        total: DEFAULT_USERS.length,
        created: results.created.length,
        updated: results.updated.length,
        errors: results.errors.length
      }
    };

  } catch (error) {
    console.error('初始化失败:', error);
    return {
      success: false,
      code: 'INIT_ERROR',
      message: '初始化失败: ' + error.message,
      data: results
    };
  }
};
