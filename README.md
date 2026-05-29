# ThaiKu - 泰语学习应用

一个基于 React Native 的离线泰语学习应用，支持场景化逐句学习、单词查询、生词本管理和间隔重复复习。

## 功能特性

- 📚 **场景化学习**: 通过真实场景音视频内容逐句学习泰语
- 🔤 **单词查询**: 点击句子中的单词查看词意、用法和例句
- 📖 **生词本**: 自动保存生词，基于艾宾浩斯间隔算法进行智能复习
- 💾 **数据持久化**: 本地 SQLite 数据库存储学习数据
- 🔄 **备份恢复**: 支持导出备份和恢复导入
- 📦 **课程导入**: 支持导入 ZIP 格式的课程包，支持动态课程管理
- 🎬 **多媒体学习**: 支持视频、音频、文档等多种课程类型

## 项目结构

```
ThaiKu/
├── src/
│   ├── screens/              # 页面组件
│   │   ├── HomeScreen.tsx         # 首页（等级列表）
│   │   ├── CourseScreen.tsx       # 课程详情页
│   │   ├── LessonListScreen.tsx   # 课程列表页
│   │   ├── LearningScreen.tsx     # 学习播放页
│   │   ├── FullTextScreen.tsx     # 全文查看页
│   │   ├── VocabScreen.tsx        # 生词本页（含复习功能）
│   │   └── SettingsScreen.tsx     # 设置页
│   ├── database/             # SQLite 数据库
│   │   └── index.ts               # 数据库操作（含间隔重复复习）
│   ├── constants/            # 常量和主题
│   │   └── theme.ts               # MD3 主题配置
│   ├── utils/                # 工具函数
│   │   ├── courseDataManager.ts   # 课程数据管理
│   │   ├── courseImporter.ts      # 课程导入（ZIP包）
│   │   └── lessonData.ts          # 课时数据
│   └── types/                # TypeScript 类型定义
│       └── index.ts
├── assets/                   # 资源文件
│   ├── index.json            # 课程索引
│   ├── dictionary.json       # 全局词典
│   └── courses/              # 课程数据
├── App.tsx                   # 应用入口
└── package.json              # 依赖配置
```

## 开发指南

### 安装依赖

```bash
npm install
```

### 运行应用

```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

### 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| **框架** | Expo ~54.0.0 | 跨平台开发框架 |
| **核心** | React Native ~0.81.5 | 原生组件库 |
| **语言** | TypeScript ~5.9.3 | 类型安全 |
| **导航** | React Navigation v6 | 路由管理 |
| **UI** | React Native Paper v5 | MD3 设计规范 |
| **数据库** | expo-sqlite ~16.0.10 | 本地数据库 |
| **视频** | expo-video ~3.0.16 | 视频播放 |
| **音频** | expo-audio ~1.1.1 | 音频播放 |
| **文件系统** | expo-file-system ~19.0.22 | 文件操作 |
| **文档选择** | expo-document-picker ~14.0.8 | 文件导入 |
| **分享** | expo-sharing ~14.0.8 | 数据导出 |
| **ZIP** | jszip ^3.10.1 | 压缩包处理 |

## 核心功能说明

### 1. 间隔重复复习

基于艾宾浩斯遗忘曲线的智能复习系统：

```typescript
// 复习间隔（分钟）
const EBBINGHAUS_INTERVALS = [5, 30, 720, 1440, 2880, 5760, 10080, 21600];
//                                    ↓   ↓    ↓    ↓    ↓    ↓     ↓     ↓
//                                    5分 30分 12时 24时  2天   4天   7天  15天
```

- 答对：推进到下一阶段，间隔时间增加
- 答错：重置到第一阶段，间隔时间回到5分钟
- 连续答对次数正确率影响复习进度

### 2. 动态课程导入

支持导入 ZIP 格式的课程包：

```
course_package.zip
├── index.json              # 课程索引
└── courses/
    └── {level_id}/
        └── {course_id}/
            └── lessons/
                └── {lesson_id}/
                    ├── meta.json       # 课时元数据
                    └── sentences.json   # 句子数据
```

导入策略：
- **overwrite**: 完全覆盖现有课程
- **keep**: 合并课程（导入包优先，保留现有独有的课时）
- **skip**: 跳过冲突课程

### 3. 数据库表结构

#### learning_progress（学习进度表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| lessonId | TEXT | 节ID |
| levelId | TEXT | 等级ID |
| courseId | TEXT | 课程ID |
| currentSentenceIndex | INTEGER | 当前句子索引 |
| completed | INTEGER | 是否完成 |
| lastStudyTime | TEXT | 最后学习时间 |
| totalTimeSpent | INTEGER | 总学习时长（秒） |

#### vocabulary（生词本表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| word | TEXT | 单词 |
| lessonId | TEXT | 来源节ID |
| addedAt | TEXT | 添加时间 |
| lastReviewTime | TEXT | 最后复习时间 |
| nextReviewAt | TEXT | 下次复习时间 |
| reviewInterval | INTEGER | 复习间隔（分钟） |
| reviewStage | INTEGER | 当前复习阶段（1-8） |
| correctStreak | INTEGER | 连续正确次数 |
| reviewCount | INTEGER | 复习次数 |
| masteryLevel | INTEGER | 掌握程度（0-5） |

#### course_versions（课程版本表）
| 字段 | 类型 | 说明 |
|------|------|------|
| levelId | TEXT | 等级ID |
| courseId | TEXT | 课程ID |
| version | TEXT | 版本号 |
| updatedAt | TEXT | 更新时间 |

## 数据格式

### 课程索引 (index.json)
```json
{
  "version": "1.0",
  "levels": [
    {
      "id": "beginner",
      "title": "初级",
      "description": "适合零基础学习者",
      "courses": [
        {
          "id": "course_01",
          "title": "日常会话入门",
          "type": "video",
          "version": "1.0",
          "thumbnail": "thumbnail.jpg",
          "lessons": [
            {
              "id": "lesson_01",
              "title": "日常生活场景",
              "scene": "life",
              "duration": 45,
              "thumbnail": "life_scenario_thumb.jpg",
              "videoUrl": "life_scenario.mp4"
            }
          ]
        }
      ]
    }
  ]
}
```

### 课时元数据 (meta.json)
```json
{
  "id": "lesson_01",
  "courseId": "course_01",
  "title": "日常生活场景",
  "scene": "life",
  "description": "学习日常生活中常用的泰语表达",
  "mediaFile": "life_scenario.mp4",
  "mediaType": "video",
  "duration": 45,
  "thumbnail": "thumbnail.jpg"
}
```

### 句子数据 (sentences.json)
```json
{
  "lessonId": "lesson_01",
  "courseId": "course_01",
  "levelId": "beginner",
  "mediaFile": "life_scenario.mp4",
  "sentences": [
    {
      "id": "s001",
      "startTime": 0,
      "endTime": 3200,
      "text": "สวัสดีครับ",
      "translation": "你好",
      "wordRefs": [
        { "word": "สวัสดี", "start": 0, "end": 6 },
        { "word": "ครับ", "start": 6, "end": 10 }
      ]
    }
  ]
}
```

### 全局词典 (dictionary.json)
```json
{
  "version": "1.0",
  "words": {
    "สวัสดี": {
      "pronunciation": "sa-was-dee",
      "meaning": "你好",
      "partOfSpeech": "interj.",
      "usage": "泰语中最常用的问候语",
      "examples": [
        {
          "sentence": "สวัสดีครับ",
          "translation": "你好"
        }
      ]
    }
  }
}
```

## 导航结构

```
App.tsx (NavigationContainer)
├── Home (首页)
│   └── Course (课程详情)
│       └── LessonList (课程列表)
│           └── Learning (学习播放)
│               └── FullText (全文查看)
├── Vocab (生词本)
└── Settings (设置)
```

## 主题配置

采用 Material Design 3 主题：

| 用途 | 颜色 | Hex |
|------|------|-----|
| 主题色 | 泰式蓝 | #0066CC |
| 强调色 | 金黄色 | #FFB84D |
| 背景色 | 浅灰 | #F5F5F5 |
| 文字色 | 深灰 | #333333 |
| 成功色 | 绿色 | #4CAF50 |

## 许可证

MIT License