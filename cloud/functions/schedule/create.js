/**
 * 检测两个时间段是否重叠
 */
function isTimeOverlap(start1, end1, start2, end2) {
  return !(end1 <= start2 || start1 >= end2);
}

/**
 * 检测课程冲突
 * @param {Object} db 数据库实例
 * @param {Object} _ 数据库命令
 * @param {Object} schedule 课程数据 { date, startTime, endTime, teacherId, studentIds }
 * @param {string|null} excludeId 排除的课程ID（编辑时使用）
 * @returns {Array} 冲突列表
 */
async function detectConflicts(db, _, schedule, excludeId) {
  const { date, startTime, endTime, teacherId, studentIds = [] } = schedule;

  // 查询同一天的所有课程
  const query = { date };
  if (excludeId) {
    query._id = _.neq(excludeId);
  }

  const { data: existingSchedules } = await db.collection('schedules').where(query).get();

  const conflicts = [];

  for (const existing of existingSchedules) {
    // 检测时间是否重叠
    if (!isTimeOverlap(startTime, endTime, existing.startTime, existing.endTime)) {
      continue;
    }

    // 教师冲突
    if (teacherId && teacherId === existing.teacherId) {
      conflicts.push({
        type: 'teacher',
        existingCourse: existing.courseName,
        time: `${existing.startTime}-${existing.endTime}`,
        message: `教师在 ${existing.startTime}-${existing.endTime} 已有课程「${existing.courseName}」`
      });
    }

    // 学生冲突
    const overlappingStudents = studentIds.filter(
      id => (existing.studentIds || []).includes(id)
    );
    if (overlappingStudents.length > 0) {
      conflicts.push({
        type: 'student',
        existingCourse: existing.courseName,
        time: `${existing.startTime}-${existing.endTime}`,
        studentCount: overlappingStudents.length,
        message: `${overlappingStudents.length}名学生在 ${existing.startTime}-${existing.endTime} 已有课程「${existing.courseName}」`
      });
    }
  }

  return conflicts;
}

/**
 * 创建课程
 * @param {Object} event - 请求参数
 * @param {Object} cloud - 云开发实例
 */
module.exports = async function create(event, cloud) {
  const {
    courseName,
    teacherId,
    studentIds = [],
    date,
    startTime,
    endTime,
    location,
    remark,
    userId,  // 前端传递的用户ID
    openid
  } = event;

  const db = cloud.database();
  const _ = db.command;
  const usersCollection = db.collection('users');
  const schedulesCollection = db.collection('schedules');

  try {
    let currentUser;

    // 优先使用前端传递的 userId
    if (userId) {
      const userRes = await usersCollection.doc(userId).get();
      if (userRes.data) {
        currentUser = userRes.data;
      }
    }

    // 如果没有 userId 或查询失败，回退到 openid 查询
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

    console.log('[schedule/create] currentUser:', {
      _id: currentUser._id,
      name: currentUser.name,
      role: currentUser.role
    });
    console.log('[schedule/create] frontend teacherId:', teacherId);

    // 只有校长和老师可以创建课程
    if (currentUser.role === 'student') {
      return {
        success: false,
        code: 'NO_PERMISSION',
        message: '无权限创建课程'
      };
    }

    // 老师只能创建自己的课程
    const finalTeacherId = currentUser.role === 'teacher' ? currentUser._id : teacherId;

    console.log('[schedule/create] finalTeacherId:', finalTeacherId);

    // 参数基本检查
    if (!courseName || !teacherId || !date || !startTime || !endTime || !studentIds || studentIds.length === 0) {
      return {
        success: false,
        code: 'INVALID_PARAMS',
        message: '缺少必要参数或未选择学生'
      };
    };

    // 验证时间
    if (startTime >= endTime) {
      return {
        success: false,
        code: 'INVALID_TIME',
        message: '结束时间必须大于开始时间'
      };
    }

    // ========== 冲突检测 ==========
    const conflicts = await detectConflicts(db, _, {
      date,
      startTime,
      endTime,
      teacherId: finalTeacherId,
      studentIds
    }, null);

    if (conflicts.length > 0) {
      return {
        success: false,
        code: 'CONFLICT',
        data: { conflicts },
        message: '检测到课程冲突'
      };
    }
    // ========== 冲突检测结束 ==========

    // 创建课程记录
    const now = new Date();
    const scheduleData = {
      courseName,
      teacherId: finalTeacherId,
      studentIds,
      date,
      startTime,
      endTime,
      location: location || '',
      remark: remark || '',
      creatorId: currentUser._id,
      createdAt: now,
      updatedAt: now
    };

    const result = await schedulesCollection.add({
      data: scheduleData
    });

    return {
      success: true,
      data: {
        scheduleId: result._id
      }
    };

  } catch (error) {
    console.error('创建课程失败:', error);
    return {
      success: false,
      code: 'CREATE_ERROR',
      message: '创建课程失败'
    };
  }
};

