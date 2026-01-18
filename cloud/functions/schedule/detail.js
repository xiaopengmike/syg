/**
 * 获取课程详情
 * @param {Object} event - 请求参数
 * @param {Object} cloud - 云开发实例
 */
module.exports = async function detail(event, cloud) {
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
        console.log('[schedule/detail] userId查询失败:', e.message);
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
    
    console.log('[schedule/detail] schedule:', {
      _id: schedule._id,
      courseName: schedule.courseName,
      teacherId: schedule.teacherId,
      creatorId: schedule.creatorId
    });

    // 权限检查
    if (currentUser.role === 'student') {
      // 学生只能查看自己参与的课程
      if (!schedule.studentIds || !schedule.studentIds.includes(currentUser._id)) {
        return {
          success: false,
          code: 'NO_PERMISSION',
          message: '无权限查看此课程'
        };
      }
    } else if (currentUser.role === 'teacher') {
      // 老师只能查看自己的课程
      if (schedule.teacherId !== currentUser._id) {
        return {
          success: false,
          code: 'NO_PERMISSION',
          message: '无权限查看此课程'
        };
      }
    }
    // 校长可以查看所有课程

    // 获取教师信息
    let teacher = null;
    if (schedule.teacherId) {
      const teacherRes = await usersCollection.doc(schedule.teacherId).get();
      if (teacherRes.data) {
        teacher = {
          _id: teacherRes.data._id,
          name: teacherRes.data.name,
          subject: teacherRes.data.subject
        };
      }
    }

    // 获取学生信息
    let students = [];
    if (schedule.studentIds && schedule.studentIds.length > 0) {
      const studentsRes = await usersCollection.where({
        _id: _.in(schedule.studentIds)
      }).field({ _id: true, name: true, className: true }).get();
      students = studentsRes.data;
    }

    // 获取创建者信息
    let creator = null;
    if (schedule.creatorId) {
      const creatorRes = await usersCollection.doc(schedule.creatorId).get();
      if (creatorRes.data) {
        creator = {
          _id: creatorRes.data._id,
          name: creatorRes.data.name,
          role: creatorRes.data.role
        };
      }
    }

    return {
      success: true,
      data: {
        schedule: {
          ...schedule,
          teacher,
          students,
          creator
        },
        canEdit: currentUser.role === 'principal' || 
                 (currentUser.role === 'teacher' && schedule.teacherId === currentUser._id)
      }
    };

  } catch (error) {
    console.error('获取课程详情失败:', error);
    return {
      success: false,
      code: 'DETAIL_ERROR',
      message: '获取课程详情失败'
    };
  }
};

