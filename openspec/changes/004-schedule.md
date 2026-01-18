# 变更提案：排课功能

## 概述

| 属性 | 值 |
|------|-----|
| 提案编号 | 004 |
| 状态 | ✅ 已完成 |
| 优先级 | 高 |
| 预计工时 | 6小时 |

## 目标

实现课程表的创建、编辑、查看和管理功能，支持周视图和日视图展示。

## 范围

### 页面

```
miniprogram/pages/
└── schedule/
    ├── index/          # 课程表首页（周视图）
    │   ├── index.js
    │   ├── index.json
    │   ├── index.wxml
    │   └── index.wxss
    ├── create/         # 创建/编辑排课
    │   ├── create.js
    │   ├── create.json
    │   ├── create.wxml
    │   └── create.wxss
    └── detail/         # 课程详情
        ├── detail.js
        ├── detail.json
        ├── detail.wxml
        └── detail.wxss
```

### 组件

```
miniprogram/components/
├── schedule-grid/      # 课程表格子组件
│   ├── schedule-grid.js
│   ├── schedule-grid.json
│   ├── schedule-grid.wxml
│   └── schedule-grid.wxss
└── schedule-card/      # 课程卡片组件
    ├── schedule-card.js
    ├── schedule-card.json
    ├── schedule-card.wxml
    └── schedule-card.wxss
```

### 云函数

```
cloud/functions/
└── schedule/
    ├── index.js        # 入口
    ├── create.js       # 创建排课
    ├── update.js       # 更新排课
    ├── delete.js       # 删除排课
    ├── list.js         # 获取课程列表
    ├── detail.js       # 获取课程详情
    └── package.json
```

### 数据库集合

- `schedules` - 课程表集合

## 实现细节

### 1. 课程表首页（周视图）

#### UI 设计
- 顶部：周切换器（上一周/本周/下一周）
- 表头：周一至周日
- 左侧：时间段（8:00-22:00，每小时一行）
- 中间：课程卡片网格
- **筛选状态**：支持按教师或按学生筛选显示课表

#### 功能
- 左右滑动切换周
- 点击空白格子快速创建
- 点击课程卡片查看详情
- 长按课程卡片快速编辑/删除

#### 权限
- 校长：查看所有课程，可创建/编辑/删除
- 老师：查看自己的课程，可创建自己的课程
- 学生：只能查看自己参与的课程

### 2. 创建/编辑排课

#### 表单字段
- 课程名称（必填）
- 授课教师（选择器，必填）
- 学生（多选，可选）
- 星期几（单选，必填）
- 开始时间（时间选择器，必填）
- 结束时间（时间选择器，必填）
- 上课地点（文本，可选）
- 备注（文本，可选）

#### 验证规则
- 结束时间必须大于开始时间
- 创建时自动检测冲突（调用冲突检测）

### 3. 课程详情

#### 展示内容
- 课程名称
- 授课教师
- 上课学生列表
- 上课时间
- 上课地点
- 创建者/创建时间

#### 操作按钮
- 编辑（有权限时显示）
- 删除（有权限时显示）

### 4. 云函数 - schedule

#### create
```javascript
// 入参
{
  courseName: "课程名称",
  teacherId: "教师ID",
  studentIds: ["学生ID数组"],
  dayOfWeek: 1,           // 1-7
  startTime: "09:00",
  endTime: "10:00",
  location: "地点",
  remark: "备注"
}

// 返回
{
  success: true,
  data: {
    scheduleId: "课程ID",
    conflicts: []         // 冲突信息（如有）
  }
}
```

#### list
```javascript
// 入参
{
  weekStart: "2024-01-01",  // 周起始日期
  teacherId: "可选，筛选教师",
  studentId: "可选，筛选学生"
}

// 返回
{
  success: true,
  data: [
    {
      _id: "课程ID",
      courseName: "课程名称",
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "10:00",
      teacher: { _id, name },
      students: [{ _id, name }]
    }
  ]
}
```

### 5. 组件设计

#### schedule-grid
- 接收课程列表数据
- 渲染周视图网格
- 事件：点击格子、点击课程

#### schedule-card
- 展示单个课程卡片
- 根据课程时长计算高度
- 不同状态不同颜色

## 验收标准

- [x] 周视图正常展示课程 (8:00-22:00)
- [x] 可创建新课程
- [x] 可编辑已有课程
- [x] 可删除课程
- [x] 左右滑动切换周正常
- [x] 不同角色看到对应权限的课程
- [x] 课程卡片显示首位学生姓名文字
- [x] 支持通过学生列表快捷查看指定学生课表

## 依赖

- 001-init-project.md（已完成）
- 002-user-auth.md（已完成）
- 003-invite-system.md（已完成）

## 后续提案

- 005-conflict-detection.md：冲突检测





