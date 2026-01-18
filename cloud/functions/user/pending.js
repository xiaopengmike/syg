/**
 * 获取待审批学生列表
 * @param {Object} event - 请求参数
 * @param {String} event.currentUserId - 当前用户ID
 * @param {Object} cloud - 云开发实例
 */
module.exports = async function pending(event, cloud) {
  const { currentUserId, openid } = event;
  const db = cloud.database();
  const usersCollection = db.collection('users');

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
        console.log('[pending] currentUserId查询失败:', e.message);
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

    // 检查权限（只有校长可以查看待审批列表）
    if (currentUser.role !== 'principal') {
      return {
        success: false,
        code: 'NO_PERMISSION',
        message: '只有校长可以查看待审批列表'
      };
    }

    // 查询待审批的学生
    const listRes = await usersCollection
      .where({
        role: 'student',
        bindStatus: 'pending_approval'
      })
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    // 获取待审批总数
    const countRes = await usersCollection
      .where({
        role: 'student',
        bindStatus: 'pending_approval'
      })
      .count();

    return {
      success: true,
      data: {
        list: listRes.data,
        totalCount: countRes.total
      }
    };

  } catch (error) {
    console.error('获取待审批列表失败:', error);
    return {
      success: false,
      code: 'PENDING_ERROR',
      message: '获取列表失败，请稍后重试'
    };
  }
};
