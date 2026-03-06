# Video Render Service

一个基于 **Node.js + ffmpeg + ffcreator** 的视频生成服务示例。

主要用于演示一个简单的视频渲染服务架构，包括单页视频渲染、视频合并以及异步任务调度。

## Features

- 单页视频渲染（renderPage）
- 多页视频合并（merge）
- 异步任务系统
- 子进程 worker 隔离渲染任务

---

## 设计思路

前端视频编辑器生成时间轴数据后，发起多页视频生成请求。

整体流程如下：

1. 前端编辑器提交视频生成任务
2. 后端调度服务拆分为多个分页渲染任务
3. 调用 **Video Render Service** 的 `/api/renderPage` 接口生成单页视频
4. 所有分页视频生成完成后，调用 `/api/merge` 接口进行视频合并
5. 在合并阶段可以加入 **转场效果、BGM、水印等**

这种架构的优点：

- 单页渲染任务可以并发执行
- 渲染任务相互隔离
- 合并阶段可以统一处理视频效果

---

## 简单架构

- API 接收视频生成任务
- Worker 子进程执行渲染任务
- ffcreator 生成单页视频
- ffmpeg 负责视频合并

---

## Tech Stack

- Node.js
- ffcreator
- ffmpeg

---

## API

### renderPage
生成单页视频

```
POST /api/renderPage
```
输入：
```
{
  "pageId": "page-001",
  "output": {
    "width": 1280,
    "height": 720,
    "fps": 30,
    "duration": 3
  },
  "tracks": [
    {
      "type": "text",
      "text": "Hello",
      "x": 120,
      "y": 120
    }
  ]
}
```

### merge 合并多个视频片段

```
POST /api/merge
```
输入：
```
{
  "clips": [
    {"clipUrl": "/job1/page-001.mp4"},
    {"clipUrl": "/job2/page-002.mp4"}
  ]
}
```

### jobs 查询任务状态

```
GET /api/jobs/:id
```

## Run

```
npm install
npm run dev
```

服务地址：
```
http://localhost:3000
```

## Related Project
前端视频编辑器

```
https://github.com/rewufu/mini-video-editor
```