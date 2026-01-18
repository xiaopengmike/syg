# 变更提案：初始化小程序项目结构

## 概述

| 属性 | 值 |
|------|-----|
| 提案编号 | 001 |
| 状态 | ✅ 已完成 |
| 优先级 | 高 |
| 预计工时 | 2小时 |

## 目标

创建微信小程序排课系统的基础项目结构，包括小程序端和云开发环境的初始化配置。

## 范围

### 需要创建的文件/目录

```
miniprogram/
├── pages/
│   └── index/              # 首页（占位）
│       ├── index.js
│       ├── index.json
│       ├── index.wxml
│       └── index.wxss
├── components/             # 组件目录（空）
├── utils/
│   ├── api.js             # API 封装
│   ├── auth.js            # 权限验证工具
│   └── util.js            # 通用工具函数
├── styles/
│   └── variables.wxss     # 全局样式变量
├── app.js                 # 小程序入口
├── app.json               # 小程序配置
├── app.wxss               # 全局样式
└── sitemap.json           # 站点地图

cloud/
└── functions/             # 云函数目录（空）

project.config.json        # 项目配置
```

## 实现细节

### 1. 小程序配置 (app.json)

```json
{
  "pages": [
    "pages/index/index"
  ],
  "window": {
    "backgroundTextStyle": "light",
    "navigationBarBackgroundColor": "#4A90D9",
    "navigationBarTitleText": "排课系统",
    "navigationBarTextStyle": "white"
  },
  "style": "v2",
  "sitemapLocation": "sitemap.json",
  "cloud": true
}
```

### 2. 小程序入口 (app.js)

- 初始化云开发环境
- 全局状态管理（用户信息、登录状态）
- 全局方法封装

### 3. 工具函数

#### api.js
- 封装云函数调用
- 统一错误处理
- 请求/响应拦截

#### auth.js
- 角色常量定义（PRINCIPAL, TEACHER, STUDENT）
- 权限检查方法
- 登录状态检查

#### util.js
- 日期格式化
- 通用工具方法

### 4. 全局样式

- 定义颜色变量（主题色、文字色、背景色）
- 定义间距变量
- 基础样式重置

### 5. 数据库初始化（预置校长账号）

系统首次部署时，需要初始化校长账号：

```javascript
// cloud/functions/init/index.js
// 初始化校长账号
const principalData = {
  _openid: '',           // 待绑定
  phone: '13800000000',  // 预置手机号
  password: 'hashed_password',  // 初始密码（加密）
  role: 'principal',
  name: '校长',
  bindStatus: 'bound',   // 校长账号默认已绑定
  _createTime: new Date(),
  _updateTime: new Date()
};
```

**初始化方式**：
- 方式 1：云开发控制台手动添加
- 方式 2：创建 init 云函数，首次调用时初始化

## 验收标准

- [x] 项目可在微信开发者工具中正常打开
- [x] 云开发环境初始化成功
- [x] 首页可正常显示
- [x] 工具函数无语法错误
- [ ] 数据库预置校长账号

## 依赖

无

## 后续提案

- 002-user-auth.md：用户认证（登录/注册）

