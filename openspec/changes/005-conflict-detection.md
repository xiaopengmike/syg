# 变更提案：冲突检测

## 概述

| 属性 | 值 |
|------|-----|
| 提案编号 | 005 |
| 状态 | ✅ 已完成 |
| 优先级 | 中 |
| 预计工时 | 1小时 |

## 目标

在创建/编辑课程时自动检测冲突，阻止冲突课程的创建，并提示冲突信息。

## 范围

### 云函数修改

```
cloud/functions/
└── schedule/
    ├── create.js       # 添加冲突检测逻辑
    └── update.js       # 添加冲突检测逻辑
```

### 前端修改

```
miniprogram/pages/
└── schedule/
    └── create/
        └── create.js   # 处理冲突错误提示
```

## 实现细节

### 1. 冲突类型

#### 教师冲突
- 同一教师在同一日期的同一时间段有多个课程

#### 学生冲突
- 同一学生在同一日期的同一时间段有多个课程

### 2. 冲突检测逻辑（云函数）

在 `schedule/create.js` 和 `schedule/update.js` 中添加冲突检测：

```javascript
/**
 * 检测两个时间段是否重叠
 * @param {string} start1 开始时间1 "HH:mm"
 * @param {string} end1 结束时间1 "HH:mm"
 * @param {string} start2 开始时间2 "HH:mm"
 * @param {string} end2 结束时间2 "HH:mm"
 * @returns {boolean}
 */
function isTimeOverlap(start1, end1, start2, end2) {
  return !(end1 <= start2 || start1 >= end2);
}

/**
 * 检测课程冲突
 * @param {Object} newSchedule 新课程数据
 * @param {string} excludeId 排除的课程ID（编辑时使用）
 * @returns {Array} 冲突列表
 */
async function detectConflicts(newSchedule, excludeId = null) {
  const db = cloud.database();
  const _ = db.command;
  
  // 查询同一天的所有课程
  const query = { date: newSchedule.date };
  if (excludeId) {
    query._id = _.neq(excludeId);
  }
  
  const { data: existingSchedules } = await db.collection('schedules').where(query).get();
  
  const conflicts = [];
  
  for (const existing of existingSchedules) {
    // 检测时间是否重叠
    if (!isTimeOverlap(newSchedule.startTime, newSchedule.endTime, 
                       existing.startTime, existing.endTime)) {
      continue;
    }
    
    // 教师冲突
    if (newSchedule.teacherId === existing.teacherId) {
      conflicts.push({
        type: 'teacher',
        existingCourse: existing.courseName,
        time: `${existing.startTime}-${existing.endTime}`,
        message: `教师在 ${existing.startTime}-${existing.endTime} 已有课程「${existing.courseName}」`
      });
    }
    
    // 学生冲突
    const overlappingStudents = (newSchedule.studentIds || []).filter(
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
```

### 3. 云函数返回格式

#### 检测到冲突时
```javascript
{
  success: false,
  code: 'CONFLICT',
  data: {
    conflicts: [
      {
        type: 'teacher',
        existingCourse: '数学课',
        time: '09:00-10:00',
        message: '教师在 09:00-10:00 已有课程「数学课」'
      }
    ]
  },
  message: '检测到课程冲突'
}
```

### 4. 前端处理

```javascript
// 在 schedule/create/create.js 的 handleSubmit 中
if (result.code === 'CONFLICT') {
  const messages = result.data.conflicts.map(c => c.message).join('\n');
  wx.showModal({
    title: '检测到冲突',
    content: messages,
    showCancel: false,
    confirmText: '知道了'
  });
  return;
}
```

## 验收标准

- [x] 创建课程时检测教师时间冲突
- [x] 创建课程时检测学生时间冲突
- [x] 编辑课程时检测冲突（排除自身）
- [x] 冲突提示信息清晰明确
- [x] 冲突时阻止课程创建

## 依赖

- 001-init-project.md（已完成）
- 002-user-auth.md（已完成）
- 004-schedule.md（已完成）

## 后续提案

（当前阶段完成）
