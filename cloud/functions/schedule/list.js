/**
 * 获取课程列表
 * @param {Object} event - 请求参数
 * @param {String} event.startDate - 开始日期 (YYYY-MM-DD)
 * @param {String} event.endDate - 结束日期 (YYYY-MM-DD)
 * @param {String} event.userId - 当前用户ID
 * @param {String} event.filterTeacherId - 教师筛选ID
 * @param {String} event.filterStudentId - 学生筛选ID
 * @param {Object} cloud - 云开发实例
 */
module.exports = async function list(event, cloud) {
  const { startDate, endDate, userId, openid, filterTeacherId, filterStudentId } = event;
  const db = cloud.database();
  const _ = db.command;
  const usersCollection = db.collection('users');
  const schedulesCollection = db.collection('schedules');

  console.log('[schedule/list] === 开始处理请求 ===');
  console.log('[schedule/list] 接收参数:', { 
    startDate, 
    endDate, 
    userId, 
    filterTeacherId, 
    filterStudentId: filterStudentId || '(空)',
    filterStudentIdType: typeof filterStudentId
  });

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
        console.log('[schedule/list] userId查询失败，尝试其他方式:', e.message);
      }
    }

    // 如果没有找到用户，尝试通过 openid 查询
    if (!currentUser && openid) {
      const currentUserRes = await usersCollection.where({
        _openid: openid
      }).get();

      if (currentUserRes.data.length > 0) {
        currentUser = currentUserRes.data[0];
      }
    }

    // 如果仍未找到，返回空列表而不是报错（允许未登录用户查看）
    if (!currentUser) {
      console.log('[schedule/list] 未找到用户，返回空列表');
      return {
        success: true,
        data: {
          list: [],
          total: 0
        }
      };
    }

    console.log('[schedule/list] currentUser:', {
      _id: currentUser._id,
      name: currentUser.name,
      role: currentUser.role
    });

    // 构建查询条件
    let query = {
      date: _.gte(startDate).and(_.lte(endDate))
    };

    // 1. 处理筛选逻辑 (filterStudentId 优先级最高)
    if (filterStudentId) {
      // 筛选特定学生的课程 (数组包含该学生ID)
      query.studentIds = filterStudentId;
      console.log('[schedule/list] Student filter applied:', filterStudentId);
    } else if (filterTeacherId && currentUser.role === 'principal') {
      // 校长筛选特定教师
      query.teacherId = filterTeacherId;
      console.log('[schedule/list] Principal teacher filter applied:', filterTeacherId);
    } else {
      // 2. 根据用户角色执行默认过滤
      if (currentUser.role === 'student') {
        // 学生只能看自己参与的课程
        query.studentIds = currentUser._id;
      } else if (currentUser.role === 'teacher') {
        // 老师只能看自己教的课程
        query.teacherId = currentUser._id;
      }
      // 校长默认看所有，不加额外过滤
    }

    console.log('[schedule/list] Final query:', JSON.stringify(query));

    // 查询课程
    const schedulesRes = await schedulesCollection
      .where(query)
      .orderBy('date', 'asc')
      .orderBy('startTime', 'asc')
      .get();

    // 获取相关教师信息
    const teacherIds = [...new Set(schedulesRes.data.map(s => s.teacherId).filter(Boolean))];
    let teachersMap = {};

    if (teacherIds.length > 0) {
      const teachersRes = await usersCollection.where({
        _id: _.in(teacherIds)
      }).field({ _id: true, name: true }).get();

      teachersMap = teachersRes.data.reduce((map, t) => {
        map[t._id] = t.name;
        return map;
      }, {});
    }

    // 获取相关学生信息
    const allStudentIds = [...new Set(schedulesRes.data.flatMap(s => s.studentIds || []).filter(Boolean))];
    let studentsMap = {};

    if (allStudentIds.length > 0) {
      const studentsRes = await usersCollection.where({
        _id: _.in(allStudentIds)
      }).field({ _id: true, name: true }).get();

      studentsMap = studentsRes.data.reduce((map, s) => {
        map[s._id] = s.name;
        return map;
      }, {});
    }

    // 组装返回数据
    const list = schedulesRes.data.map(schedule => {
      const students = (schedule.studentIds || []).map(id => ({
        _id: id,
        name: studentsMap[id] || '未知学生'
      }));
      
      return {
        ...schedule,
        teacherName: teachersMap[schedule.teacherId] || '未知老师',
        students: students // 确保 students 字段存在且不为 undefined
      };
    });

    return {
      success: true,
      data: {
        list,
        total: list.length
      }
    };

  } catch (error) {
    console.error('获取课程列表失败:', error);
    return {
      success: false,
      code: 'LIST_ERROR',
      message: '获取课程列表失败'
    };
  }
};
