# 微信小程序排课系统

基于微信云开发的排课系统，支持校长、老师、学生三个角色，提供课程表创建管理和冲突检测功能。

## 功能特性

- 📅 **课程表管理**：创建、编辑、查看课程表
- ⚠️ **冲突检测**：自动检测时间、教室、教师冲突
- 👥 **多角色支持**：校长、老师、学生不同权限
- ☁️ **云端同步**：基于微信云开发，数据实时同步

## 项目结构

```
.
├── openspec/               # OpenSpec 规范文档
│   ├── project.md          # 项目描述、技术栈和约定
│   └── changes/            # 变更提案目录
├── miniprogram/            # 小程序代码目录
│   ├── pages/              # 页面
│   ├── components/         # 组件
│   ├── utils/              # 工具函数
│   ├── app.js              # 入口文件
│   ├── app.json            # 配置文件
│   └── app.wxss            # 全局样式
├── cloud/                  # 云开发目录
│   └── functions/          # 云函数
├── agents.md               # AI 代理配置
└── README.md               # 项目说明
```

## 开发环境

1. 下载并安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 注册微信小程序并开通云开发
3. 克隆本项目，使用微信开发者工具打开

## 技术栈

- **前端**：微信小程序原生框架
- **后端**：微信云开发（云函数 + 云数据库 + 云存储）
- **语言**：JavaScript / TypeScript

## 用户角色

| 角色 | 权限 |
|------|------|
| 校长 | 管理所有课程、教师、学生和教室资源 |
| 老师 | 查看课程表、申请课程调整 |
| 学生 | 查看课程表、选课 |

## 开发规范

详见 [openspec/project.md](./openspec/project.md)

## 许可证

MIT License
