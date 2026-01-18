/**
 * 检测两个时间段是否重叠
 */
function isTimeOverlap(start1, end1, start2, end2) {
  return !(end1 <= start2 || start1 >= end2);
}

/**
 * 检测课程冲突
 */
async function detectConflicts(db, _, schedule, excludeId) {
  const { date, startTime, endTime, teacherId, studentIds = [] } = schedule;

  const query = { date };
  if (excludeId) {
    query._id = _.neq(excludeId);
  }

  const { data: existingSchedules } = await db.collection('schedules').where(query).get();

  const conflicts = [];

  for (const existing of existingSchedules) {
    if (!isTimeOverlap(startTime, endTime, existing.startTime, existing.endTime)) {
      continue;
    }

    if (teacherId && teacherId === existing.teacherId) {
      conflicts.push({
        type: 'teacher',
        existingCourse: existing.courseName,
        time: `${existing.startTime}-${existing.endTime}`,
        message: `教师在 ${existing.startTime}-${existing.endTime} 已有课程「${existing.courseName}」`
      });
    }

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
 * 更新课程
 * @param {Object} event - 请求参数
 * @param {Object} cloud - 云开发实例
 */
module.exports = async function update(event, cloud) {
  const {
    scheduleId,
    courseName,
    teacherId,
    studentIds,
    date,
    startTime,
    endTime,
    location,
    remark,
    userId,
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
      try {
        const userRes = await usersCollection.doc(userId).get();
        if (userRes.data) {
          currentUser = userRes.data;
        }
      } catch (e) {
        console.log('[schedule/update] userId查询失败:', e.message);
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

    // 获取原课程信息
    const scheduleRes = await schedulesCollection.doc(scheduleId).get();
    if (!scheduleRes.data) {
      return {
        success: false,
        code: 'NOT_FOUND',
        message: '课程不存在'
      };
    }

    const schedule = scheduleRes.data;

    // 权限检查：校长可以编辑所有，老师只能编辑自己的课程
    if (currentUser.role === 'teacher' && schedule.teacherId !== currentUser._id) {
      return {
        success: false,
        code: 'NO_PERMISSION',
        message: '无权限编辑此课程'
      };
    }

    if (currentUser.role === 'student') {
      return {
        success: false,
        code: 'NO_PERMISSION',
        message: '无权限编辑课程'
      };
    }

    // 验证时间
    if (startTime && endTime && startTime >= endTime) {
      return {
        success: false,
        code: 'INVALID_TIME',
        message: '结束时间必须大于开始时间'
      };
    }

    // 构建更新数据
    const updateData = {
      updatedAt: new Date()
    };

    if (courseName !== undefined) updateData.courseName = courseName;
    if (teacherId !== undefined && currentUser.role === 'principal') {
      updateData.teacherId = teacherId;
    }
    if (studentIds !== undefined) updateData.studentIds = studentIds;
    if (date !== undefined) updateData.date = date;
    if (startTime !== undefined) updateData.startTime = startTime;
    if (endTime !== undefined) updateData.endTime = endTime;
    if (location !== undefined) updateData.location = location;
    if (remark !== undefined) updateData.remark = remark;

    // 如果更新学生列表，确保不为空
    if (updateData.studentIds !== undefined && (!updateData.studentIds || updateData.studentIds.length === 0)) {
      return {
        success: false,
        code: 'INVALID_PARAMS',
        message: '上课学生不能为空'
      };
    }

    // ========== 冲突检测 ==========
    // 合并原始数据和更新数据进行冲突检测
    const checkData = {
      date: updateData.date || schedule.date,
      startTime: updateData.startTime || schedule.startTime,
      endTime: updateData.endTime || schedule.endTime,
      teacherId: updateData.teacherId || schedule.teacherId,
      studentIds: updateData.studentIds || schedule.studentIds || []
    };

    const conflicts = await detectConflicts(db, _, checkData, scheduleId);

    if (conflicts.length > 0) {
      return {
        success: false,
        code: 'CONFLICT',
        data: { conflicts },
        message: '检测到课程冲突'
      };
    }
    // ========== 冲突检测结束 ==========

    // 更新课程
    await schedulesCollection.doc(scheduleId).update({
      data: updateData
    });

    return {
      success: true,
      data: {
        scheduleId
      }
    };

  } catch (error) {
    console.error('更新课程失败:', error);
    return {
      success: false,
      code: 'UPDATE_ERROR',
      message: '更新课程失败'
    };
  }
};


