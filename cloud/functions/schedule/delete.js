/**
 * 删除课程
 * @param {Object} event - 请求参数
 * @param {Object} cloud - 云开发实例
 */
module.exports = async function remove(event, cloud) {
  const { scheduleId, userId, openid } = event;

  const db = cloud.database();
  const _ = db.command;
  const usersCollection = db.collection('users');
  const schedulesCollection = db.collection('schedules');

  try {
    let currentUser;

    // 优先使用前端传递的 userId
    if (userId) {
      try {
        const userRes = await usersCollection.doc(userId).get();
        if (userRes.data) {
          currentUser = userRes.data;
        }
      } catch (e) {
        console.log('[schedule/delete] userId查询失败:', e.message);
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

    // 获取课程信息
    const scheduleRes = await schedulesCollection.doc(scheduleId).get();
    if (!scheduleRes.data) {
      return {
        success: false,
        code: 'NOT_FOUND',
        message: '课程不存在'
      };
    }

    const schedule = scheduleRes.data;

    // 权限检查：校长可以删除所有，老师只能删除自己的课程
    if (currentUser.role === 'teacher' && schedule.teacherId !== currentUser._id) {
      return {
        success: false,
        code: 'NO_PERMISSION',
        message: '无权限删除此课程'
      };
    }

    if (currentUser.role === 'student') {
      return {
        success: false,
        code: 'NO_PERMISSION',
        message: '无权限删除课程'
      };
    }

    // 删除课程
    await schedulesCollection.doc(scheduleId).remove();

    return {
      success: true,
      data: {
        scheduleId
      }
    };

  } catch (error) {
    console.error('删除课程失败:', error);
    return {
      success: false,
      code: 'DELETE_ERROR',
      message: '删除课程失败'
    };
  }
};


