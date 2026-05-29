# ThaiKu - 泰语学习应用产品文档

## 1. 产品概述

### 1.1 产品愿景
打造一个贴近真实语言使用场景的泰语学习应用，通过逐句解析真实录音和视频内容，结合间隔重复复习算法，帮助用户在沉浸式环境中自然习得泰语。

### 1.2 目标用户
- **全阶段学习者**：覆盖从零基础到进阶的不同水平用户
- **实用导向用户**：希望通过真实场景学习，而不仅仅是词汇记忆
- **碎片化学习人群**：利用零散时间学习，需要高效学习方式

---

## 2. 核心功能模块

### 2.1 场景化逐句学习（核心差异化功能）
- 支持**内置和动态导入**音视频学习内容
- 音视频内容按**句子级别预先拆分**
- 以句子为单位进行学习：播放、暂停、循环、跳转
- 句子展示：原文、翻译、音标
- 选中句子中的单词进行**查词**
- 显示单词的词意、用法、例句
- 当前句子高亮，进度追踪

### 2.2 词汇学习与间隔重复
- 单词卡片（词意、发音、例句）
- **艾宾浩斯间隔重复算法**辅助记忆
- 自动计算下次复习时间
- 答对/答错机制动态调整复习间隔
- 复习队列管理（今日到期单词）
- 连续正确次数追踪

### 2.3 课程管理
- 动态课程导入（ZIP 格式）
- 课程版本管理
- 冲突检测与解决（覆盖/合并/跳过）
- 支持视频、音频、文档多种类型

### 2.4 数据管理
- 本地 SQLite 数据库存储
- 学习进度持久化
- 生词本持久化
- 数据备份与恢复

---

## 3. 用户体验流程

### 3.1 核心学习流程
```
选择等级/课程
    ↓
选择课时
    ↓
播放音视频，句子级跳转
    ↓
点击句子查看翻译
    ↓
选中句子中的单词
    ↓
查词显示：词意、用法、例句
    ↓
添加到生词本
    ↓
自动计算复习时间（5分钟后）
```

### 3.2 间隔重复复习流程
```
打开生词本
    ↓
显示今日到期复习单词
    ↓
词卡翻转测试
    ↓
标记掌握程度（认识/不认识）
    ↓
    ├─ 认识：推进到下一阶段，延长间隔
    │   └─ 连续答对累加
    └─ 不认识：重置到第一阶段，缩短间隔
    ↓
更新下次复习时间
```

### 3.3 动态课程导入流程
```
打开设置 → 导入课程
    ↓
选择 ZIP 课程包
    ↓
验证课程包格式
    ↓
检测课程冲突
    ↓
选择处理策略（覆盖/合并/跳过）
    ↓
解压并保存课程数据
    ↓
更新课程索引
```

---

## 4. 技术方案

### 4.1 技术栈
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
| **ZIP** | jszip ^3.10.1 | 压缩包处理 |

### 4.2 数据策略
- **完全离线**：所有数据打包在应用内或用户导入，无需联网
- **混合存储**：
  - **内置资源包**：预置在应用 assets 中，随应用打包
  - **动态资源包**：用户导入的额外学习包，存储在文档目录
- **数据持久化**：
  - 学习进度：本地 SQLite 数据库
  - 生词本：本地 SQLite 数据库（含间隔重复数据）
  - 课程版本：本地 SQLite 数据库
- **导入导出**：
  - 课程包：ZIP 格式导入
  - 用户数据：JSON 格式备份/恢复

### 4.3 艾宾浩斯间隔算法

基于艾宾浩斯遗忘曲线的复习间隔设计：

```typescript
// 复习间隔（分钟）
const EBBINGHAUS_INTERVALS = [
  5,      // 5分钟  (第1阶段)
  30,     // 30分钟 (第2阶段)
  720,    // 12小时 (第3阶段)
  1440,   // 24小时 (第4阶段)
  2880,   // 2天    (第5阶段)
  5760,   // 4天    (第6阶段)
  10080,  // 7天    (第7阶段)
  21600   // 15天   (第8阶段)
];
```

**更新规则**：
- 答对：推进到下一阶段（最大8阶段），间隔时间延长
- 答错：重置到第1阶段，间隔时间回到5分钟
- 连续答对次数影响复习进度（但主要靠答对次数推进）

### 4.4 关键技术点
| 技术点 | 说明 | 技术方案 |
|--------|------|----------|
| 视频播放 | 流畅播放+句子跳转 | expo-video |
| 音频播放 | 音频课程支持 | expo-audio |
| 文本选择 | 单词选中查词 | 自定义文本选择组件 |
| JSON解析 | 资源包数据解析 | 标准 JSON 解析 |
| 本地存储 | 生词本、进度存储 | SQLite |
| 文件操作 | 资源包导入导出 | expo-file-system + jszip |
| 课程管理 | 动态课程加载 | 文档目录 + 缓存机制 |
| 备份恢复 | 数据备份恢复 | JSON 导出/导入 |

---

## 5. 数据格式说明

### 5.1 学习包结构
学习数据包采用层级结构：等级 → 课程 → 节数（场景）

```
assets/ (内置) 或 courses/ (动态)
├── dictionary.json                # 全局共享词典
├── index.json                     # 整体索引
└── courses/                       # 课程数据
    └── {level_id}/                # 等级目录
        └── {course_id}/           # 课程目录
            └── lessons/           # 课时目录
                └── {lesson_id}/   # 课时目录
                    ├── meta.json  # 课时元数据
                    └── sentences.json  # 句子数据
```

### 5.2 整体索引（index.json）
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

### 5.3 课时元数据（meta.json）
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

### 5.4 句子数据格式（sentences.json）
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

### 5.5 全局词典格式（dictionary.json）
```json
{
  "version": "1.0",
  "words": {
    "สวัสดี": {
      "pronunciation": "sa-was-dee",
      "meaning": "你好",
      "partOfSpeech": "interj.",
      "usage": "泰语中最常用的问候语，可全天使用",
      "examples": [
        {
          "sceneId": "scene_greeting",
          "sentence": "สวัสดีครับ",
          "translation": "你好"
        }
      ]
    }
  }
}
```

### 5.6 课程包 ZIP 格式

导入包结构：
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

### 5.7 媒体规格
- **视频格式**: H.264
- **分辨率**: 720p (1280x720)
- **音频**: AAC, 44.1kHz, 立体声
- **容器格式**: MP4（视频）、MP3（音频）
- **缩略图**: JPG, 300x200

---

## 6. 用户数据持久化

### 6.1 数据存储结构
用户数据存储在应用沙盒目录：

```
应用沙盒/
├── Documents/
│   ├── courses/              # 动态课程数据
│   │   └── index.json        # 课程索引
│   └── thaiku.db            # SQLite 数据库
└── Library/
    └── (缓存等)
```

### 6.2 SQLite 数据库表结构

#### 学习进度表（learning_progress）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| lessonId | TEXT | 节ID (UNIQUE) |
| levelId | TEXT | 等级ID |
| courseId | TEXT | 课程ID |
| currentSentenceIndex | INTEGER | 当前句子索引 |
| completed | INTEGER | 是否完成 (0/1) |
| lastStudyTime | TEXT | 最后学习时间 (ISO 8601) |
| totalTimeSpent | INTEGER | 总学习时长（秒） |

#### 生词本表（vocabulary）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| word | TEXT | 单词 |
| lessonId | TEXT | 来源节ID |
| addedAt | TEXT | 添加时间 (ISO 8601) |
| lastReviewTime | TEXT | 最后复习时间 (ISO 8601) |
| nextReviewAt | TEXT | 下次复习时间 (ISO 8601) |
| reviewInterval | INTEGER | 复习间隔（分钟） |
| reviewStage | INTEGER | 当前复习阶段（1-8） |
| correctStreak | INTEGER | 连续正确次数 |
| reviewCount | INTEGER | 复习次数 |
| masteryLevel | INTEGER | 掌握程度（0-5） |
| UNIQUE | - | (word, lessonId) |

#### 课程版本表（course_versions）
| 字段 | 类型 | 说明 |
|------|------|------|
| levelId | TEXT | 等级ID |
| courseId | TEXT | 课程ID |
| version | TEXT | 版本号 |
| updatedAt | TEXT | 更新时间 (ISO 8601) |
| PRIMARY KEY | - | (levelId, courseId) |

### 6.3 数据备份与恢复

**导出备份**：
- 将 SQLite 数据库表导出为 JSON
- 生成备份文件：`thaiku_backup_YYYYMMDD.json`

**备份文件格式**：
```json
{
  "version": "1.0",
  "exportedAt": "2026-05-29T00:00:00Z",
  "learningProgress": [...],
  "vocabulary": [...]
}
```

---

## 7. 页面结构

### 7.1 页面列表

| 页面 | 路由 | 说明 |
|------|------|------|
| HomeScreen | Home | 首页，展示等级列表 |
| CourseScreen | Course | 课程详情页 |
| LessonListScreen | LessonList | 课程课时列表 |
| LearningScreen | Learning | 学习播放页 |
| FullTextScreen | FullText | 全文查看页 |
| VocabScreen | Vocab | 生词本（含复习） |
| SettingsScreen | Settings | 设置页 |

### 7.2 导航结构

```
Home (首页)
  └─ Course (课程详情)
      └─ LessonList (课时列表)
          └─ Learning (学习播放)
              └─ FullText (全文查看)
Vocab (生词本)
Settings (设置)
```

---

## 8. 功能范围

### 8.1 已实现功能
- ✅ 内置资源包加载（视频/音频）
- ✅ 动态课程导入（ZIP 格式）
- ✅ 课程版本管理与冲突检测
- ✅ 句子级播放控制（上一句/下一句/循环）
- ✅ 句子原文 + 翻译展示
- ✅ 选中句子中的单词查词
- ✅ 单词详情：词意、用法、例句
- ✅ 生词本功能（添加、删除、查看）
- ✅ 间隔重复复习算法
- ✅ 学习进度自动保存
- ✅ 数据备份导出
- ✅ 数据恢复导入
- ✅ 全文查看功能

### 8.2 后续迭代方向
- 语音识别和跟读反馈
- 学习路径推荐
- 社区内容分享
- 游戏化元素
- 云同步功能

---

## 9. 成功指标

### 9.1 产品指标
- 资源包加载成功率
- 单词查询响应时间
- 生词本添加次数
- 平均学习时长
- 复习完成率
- 备份/恢复成功率

### 9.2 技术指标
- 音视频播放流畅度
- 句子跳转响应时间
- 内存占用
- 崩溃率
- 数据备份耗时
- 文件导入导出成功率

---

**文档版本**: v2.0
**创建日期**: 2026/05/20
**更新日期**: 2026/05/29
**状态**: 当前

### 更新记录
- v2.0 (2026/05/29): 更新技术栈、新增间隔重复复习、动态课程导入、课程版本管理
- v1.5 (2026/05/20): 新增数据持久化、备份导入导出方案
- v1.0 (2026/05/20): 初始版本