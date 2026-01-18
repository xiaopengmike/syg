/**
 * 获取用户列表
 * @param {Object} event - 请求参数
 * @param {String} event.role - 角色筛选 (teacher/student)
 * @param {String} event.keyword - 搜索关键词
 * @param {Object} cloud - 云开发实例
 */
module.exports = async function list(event, cloud) {
  const { role, keyword, openid, currentUserId } = event;
  const db = cloud.database();
  const _ = db.command;
  const usersCollection = db.collection('users');

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
        console.log('[user/list] currentUserId查询失败:', e.message);
      }
    }

    // 如果没有 currentUserId 或查询失败，回退到 openid 查询
    if (!currentUser && openid) {
      const currentUserRes = await usersCollection.where({
        _openid: openid
      }).get();

      if (currentUserRes.data.length > 0) {
        currentUser = currentUserRes.data[0];
      }
    }

    // 如果仍未找到用户
    if (!currentUser) {
      return {
        success: false,
        code: 'NOT_LOGGED_IN',
        message: '请先登录'
      };
    }

    // 构建查询条件
    let query = {};

    // 校长可以看所有，老师只能看自己创建的学生
    if (currentUser.role === 'principal') {
      // 校长看所有老师或学生
      if (role) {
        query.role = role;
      } else {
        query.role = _.in(['teacher', 'student']);
      }
    } else if (currentUser.role === 'teacher') {
      // 老师只能查看学生列表，不能查看老师列表
      if (role === 'teacher') {
        return {
          success: false,
          code: 'NO_PERMISSION',
          message: '无权限查看老师列表'
        };
      }
      // 老师只能看自己创建的学生
      query.role = 'student';
      query.creatorId = currentUser._id;
    } else {
      // 学生无权限查看
      return {
        success: false,
        code: 'NO_PERMISSION',
        message: '无权限查看'
      };
    }

    // 关键词搜索
    if (keyword) {
      query.name = db.RegExp({
        regexp: keyword,
        options: 'i'
      });
    }

    // 查询用户列表
    const listRes = await usersCollection
      .where(query)
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    // 获取当前查询的总数
    const countRes = await usersCollection.where(query).count();
    const totalCount = countRes.total;

    return {
      success: true,
      data: {
        list: listRes.data,
        totalCount
      }
    };

  } catch (error) {
    console.error('获取用户列表失败:', error);
    return {
      success: false,
      code: 'LIST_ERROR',
      message: '获取列表失败'
    };
  }
};




