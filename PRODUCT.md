# ThaiKu - 泰语学习应用产品文档

## 1. 产品概述

### 1.1 产品愿景
打造一个贴近真实语言使用场景的泰语学习应用，通过逐句解析真实录音和视频内容，帮助用户在沉浸式环境中自然习得泰语。

### 1.2 目标用户
- **全阶段学习者**：覆盖从零基础到进阶的不同水平用户
- **实用导向用户**：希望通过真实场景学习，而不仅仅是词汇记忆
- **碎片化学习人群**：利用零散时间学习，需要高效学习方式

---

## 2. 核心功能模块

### 2.1 场景化逐句学习（核心差异化功能）
- 支持**离线导入**预设的音视频学习内容包
- 音视频内容按**句子级别预先拆分**
- 以句子为单位进行学习：播放、暂停、循环
- 句子展示：原文、翻译、音标
- 选中句子中的单词进行**查词**
- 显示单词的词意、用法、例句
- 当前句子高亮，进度追踪

### 2.2 词汇学习
- 单词卡片（词意、发音、例句）
- 间隔重复算法（Spaced Repetition）辅助记忆
- 从场景内容中提取生词本
- 单词查词功能

### 2.3 会话练习
- 场景对话库（旅游、日常、商务等）
- 跟读练习（可选）

### 2.4 语法学习
- 语法知识点库
- 场景内容关联语法解释（后续迭代）

---

## 3. 用户体验流程

### 3.1 核心学习流程（离线导入模式）
```
导入学习数据包（音视频+句子数据）
    ↓
选择场景/课程
    ↓
播放音视频，句子级跳转
    ↓
长按/点击句子
    ↓
显示句子翻译
    ↓
选中句子中的单词
    ↓
查词显示：词意、用法、例句
    ↓
添加到生词本
```

### 3.2 单词复习流程
```
打开生词本
    ↓
基于间隔算法的复习队列
    ↓
词卡翻转测试
    ↓
标记掌握程度（简单/困难/不认识）
    ↓
更新下次复习时间
```

---

## 4. 技术方案

### 4.1 技术栈
- **跨平台框架**：React Native
- **开发语言**：TypeScript
- **状态管理**：待定（Redux Toolkit / Zustand / React Context）
- **UI 组件库**：待定（React Native Paper / NativeBase / 自定义）

### 4.2 数据策略
- **完全离线**：所有数据打包在应用内或用户导入，无需联网
- **资源包类型**：
  - **内置资源包**：预置在应用 assets 中，随应用打包
  - **用户资源包**：用户导入的额外学习包，可导出备份
- **数据持久化**：
  - 学习进度：本地数据库存储
  - 生词本：本地数据库存储
  - 用户数据：支持导出/导入备份
- **导入导出**：
  - 资源包：支持从文件系统导入，导出为标准格式
  - 用户数据：支持一键导出备份，恢复导入

### 4.3 关键技术点
| 技术点 | 说明 | 技术方案 |
|--------|------|----------|
| 视频播放 | 流畅播放+句子跳转 | react-native-video |
| 文本选择 | 单词选中查词 | 自定义文本选择组件 |
| JSON解析 | 资源包数据解析 | 标准 JSON 解析 |
| 本地存储 | 生词本、进度存储 | SQLite |
| 文件操作 | 资源包导入导出 | react-native-fs |
| 资源管理 | 内置资源包加载 | React Native Assets Bundle |
| 用户数据 | 数据备份恢复 | ZIP 打包 + 文件选择器 |

---

## 5. 数据格式说明

### 5.1 学习包结构
学习数据包采用层级结构：等级 → 课程 → 节数（场景）

```
assets/
├── dictionary.json                # 全局共享词典
├── index.json                     # 整体索引
└── courses/                       # 课程数据
    ├── beginner/                  # 初级
    │   ├── course_01/             # 课程1（视频课程）
    │   │   ├── meta.json          # 课程元数据
    │   │   ├── thumbnail.jpg
    │   │   └── lessons/
    │   │       ├── lesson_01/    # 第1节 - 场景：生活
    │   │       │   ├── meta.json
    │   │       │   ├── sentences.json
    │   │       │   ├── thumbnail.jpg
    │   │       │   └── media/
    │   │       │       └── life_scenario.mp4
    │   │       ├── lesson_02/    # 第2节 - 场景：旅行
    │   │       │   ├── meta.json
    │   │       │   ├── sentences.json
    │   │       │   └── media/
    │   │       │       └── travel_scenario.mp4
    │   │       └── lesson_03/    # 第3节 - 场景：购物
    │   └── course_02/             # 课程2（音频课程）
    │       ├── meta.json
    │       ├── thumbnail.jpg
    │       └── lessons/
    │           ├── lesson_01/    # 第1节 - 场景：娱乐
    │           │   ├── meta.json
    │           │   ├── sentences.json
    │           │   └── media/
    │           │       └── entertainment.mp3
    ├── intermediate/              # 中级
    │   ├── course_01/
    │   └── course_02/
    └── advanced/                  # 高级
        ├── course_01/
        └── course_02/
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
          "thumbnail": "beginner_course_01_thumb.jpg",
          "lessons": [
            {
              "id": "lesson_01",
              "title": "日常生活场景",
              "scene": "life",
              "duration": 45,
              "thumbnail": "life_scenario_thumb.jpg"
            },
            {
              "id": "lesson_02",
              "title": "旅行场景",
              "scene": "travel",
              "duration": 50,
              "thumbnail": "travel_scenario_thumb.jpg"
            }
          ]
        },
        {
          "id": "course_02",
          "title": "基础听力训练",
          "type": "audio",
          "thumbnail": "beginner_course_02_thumb.jpg",
          "lessons": [
            {
              "id": "lesson_01",
              "title": "娱乐场景",
              "scene": "entertainment",
              "duration": 30,
              "thumbnail": "entertainment_scenario_thumb.jpg"
            }
          ]
        }
      ]
    },
    {
      "id": "intermediate",
      "title": "中级",
      "description": "适合有一定基础的学习者",
      "courses": []
    },
    {
      "id": "advanced",
      "title": "高级",
      "description": "适合进阶学习者",
      "courses": []
    }
  ]
}
```

### 5.3 课程元数据（courses/beginner/course_01/meta.json）
```json
{
  "id": "course_01",
  "title": "日常会话入门",
  "description": "学习泰语基础会话，涵盖日常生活常用场景",
  "level": "beginner",
  "type": "video",
  "totalDuration": 95,
  "thumbnail": "thumbnail.jpg",
  "tags": ["日常", "入门", "会话"]
}
```

### 5.4 节元数据（courses/beginner/course_01/lessons/lesson_01/meta.json）
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
  "thumbnail": "thumbnail.jpg",
  "tags": ["生活", "日常"]
}
```

### 5.5 句子数据格式（sentences.json）
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

### 5.6 全局词典格式（dictionary.json）
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
    },
    "ครับ": {
      "pronunciation": "khrap",
      "meaning": "（男性礼貌语气词）",
      "partOfSpeech": "particle",
      "usage": "男性在句尾使用的礼貌助词，表示尊敬",
      "examples": [
        {
          "sceneId": "scene_greeting",
          "sentence": "สวัสดีครับ",
          "translation": "你好"
        },
        {
          "sceneId": "scene_order_food",
          "sentence": "ขอบคุณครับ",
          "translation": "谢谢"
        }
      ]
    }
  }
}
```

### 5.7 场景分类说明

| 场景分类 | 说明 | 示例标签 |
|---------|------|----------|
| life | 生活场景 | 生活、日常、家庭 |
| travel | 旅行场景 | 旅行、交通、问路 |
| entertainment | 娱乐场景 | 娱乐、电影、音乐 |
| shopping | 购物场景 | 购物、市场、讨价还价 |
| food | 美食场景 | 点餐、美食、菜单 |
| work | 工作场景 | 工作、会议、商务 |

### 5.8 资源包文件格式
资源包以 ZIP 压缩包形式导入导出：

```
thai_ku_package.zip
├── manifest.json          # 资源包清单
├── dictionary.json        # 词典数据（可选，若无则使用全局词典）
├── courses/               # 课程数据
│   └── beginner/
│       └── course_01/
│           ├── meta.json
│           ├── thumbnail.jpg
│           └── lessons/
│               └── lesson_01/
│                   ├── meta.json
│                   ├── sentences.json
│                   └── media/
│                       └── life_scenario.mp4
└── assets/                # 公共资源（缩略图等）
```

**manifest.json** 格式：
```json
{
  "version": "1.0",
  "packageId": "custom_001",
  "title": "自定义课程包",
  "description": "用户自定义的学习内容",
  "author": "用户名",
  "createdAt": "2026-05-20T10:00:00Z",
  "courses": [
    {
      "levelId": "beginner",
      "courseId": "course_01",
      "lessonCount": 3
    }
  ]
}
```

### 5.9 媒体规格
- **视频格式**: H.264
- **分辨率**: 720p (1280x720)
- **音频**: AAC, 44.1kHz, 立体声
- **容器格式**: MP4（视频）、MP3（音频）
- **缩略图**: JPG, 300x200
- **ZIP压缩**: Deflate 压缩

---

## 6. 用户数据持久化

### 6.1 数据存储结构
用户数据存储在应用沙盒目录：

```
应用沙盒/
├── Documents/
│   ├── user_packages/        # 用户导入的资源包
│   │   ├── package_001/      # 解压后的资源包
│   │   └── package_002/
│   ├── dictionary_user.json  # 用户自定义词典（可选）
│   └── backup/               # 备份目录
└── Library/
    └── thaidb.sqlite        # SQLite 数据库
```

### 6.2 SQLite 数据库表结构

**学习进度表（learning_progress）**：
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| lessonId | TEXT | 节ID |
| levelId | TEXT | 等级ID |
| courseId | TEXT | 课程ID |
| currentSentenceIndex | INTEGER | 当前句子索引 |
| completed | BOOLEAN | 是否完成 |
| lastStudyTime | TIMESTAMP | 最后学习时间 |
| totalTimeSpent | INTEGER | 总学习时长（秒） |

**生词本表（vocabulary）**：
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| word | TEXT | 单词 |
| lessonId | TEXT | 来源节ID |
| addedAt | TIMESTAMP | 添加时间 |
| lastReviewTime | TIMESTAMP | 最后复习时间 |
| reviewCount | INTEGER | 复习次数 |
| masteryLevel | INTEGER | 掌握程度（0-5） |

### 6.3 数据备份与恢复

**导出备份**：
- 将 SQLite 数据库导出为 JSON
- 将用户资源包打包为 ZIP
- 生成备份文件：`thaiku_backup_YYYYMMDD.zip`

**备份文件结构**：
```
thaiku_backup_20260520.zip
├── backup.json              # 备份元信息
├── data.json                # 用户学习数据
├── user_packages/           # 用户资源包
│   ├── package_001/
│   └── package_002/
└── custom_dictionary.json   # 用户自定义词典
```

**恢复导入**：
- 验证备份文件完整性
- 合并或覆盖现有数据
- 保留原数据作为冲突备份

---

## 7. MVP 阶段功能范围

### 7.1 MVP 核心功能（第一版）
- ✅ 加载内置资源包（视频/音频）
- ✅ 句子级播放控制（上一句/下一句/循环）
- ✅ 句子原文 + 翻译展示
- ✅ 选中句子中的单词查词
- ✅ 单词详情：词意、用法、例句
- ✅ 生词本功能（添加、删除、查看）
- ✅ 学习进度自动保存
- ✅ 数据备份导出
- ✅ 数据恢复导入

### 7.2 MVP 暂不包含
- ❌ 外部资源包导入（第一版只支持内置+备份恢复）
- ❌ 用户上传/编辑音视频内容
- ❌ 语音识别和跟读反馈
- ❌ 间隔重复算法（手动复习）
- ❌ 云同步功能
- ❌ 社交功能
- ❌ 游戏化元素

---

## 8. 后续迭代方向

### 8.1 第二版
- 外部资源包导入能力
- 间隔重复算法
- 语法知识库扩展

### 8.2 第三版
- 语音识别跟读反馈
- 学习路径推荐
- 社区内容分享

---

## 9. 成功指标

### 9.1 产品指标
- 资源包加载成功率
- 单词查询响应时间
- 生词本添加次数
- 平均学习时长
- 备份/恢复成功率

### 9.2 技术指标
- 音视频播放流畅度
- 句子跳转响应时间
- 内存占用
- 崩溃率
- 数据备份耗时
- 文件导入导出成功率

---

## 10. 风险与挑战

| 风险 | 影响 | 应对策略 |
|------|------|----------|
| 资源包制作成本高 | 内容获取困难 | 建立标准化工具，简化制作流程 |
| 应用包体积过大 | 下载/安装困难 | MVP 只包含示例内容，提供精简版 |
| 设备存储空间不足 | 影响用户体验 | 支持删除已学内容，提醒存储空间 |
| 泰语分词准确性 | 查词体验差 | 预处理资源包，手动标注单词边界 |
| 数据备份失败 | 用户数据丢失 | 备份前验证，失败时提示原因 |
| 跨版本兼容性 | 备份无法恢复 | 备份文件包含版本号，提供迁移方案 |

---

## 11. 项目结构规划

```
ThaiKu/
├── src/
│   ├── components/           # 公共组件
│   │   ├── SentencePlayer/   # 句子播放器
│   │   ├── WordPopup/        # 单词查词弹窗
│   │   ├── VocabCard/        # 生词卡片
│   │   └── ProgressBar/      # 进度条
│   ├── screens/              # 页面组件
│   │   ├── HomeScreen/       # 首页（等级/课程列表）
│   │   ├── CourseScreen/     # 课程详情（节列表）
│   │   ├── LearningScreen/   # 学习播放页面
│   │   ├── VocabScreen/      # 生词本页面
│   │   └── SettingsScreen/   # 设置页面（备份/恢复）
│   ├── navigation/           # 导航配置
│   ├── database/             # SQLite 数据库
│   │   ├── schema.ts         # 数据库表结构
│   │   └── index.ts          # 数据库操作
│   ├── storage/              # 文件系统操作
│   │   ├── packageLoader.ts  # 资源包加载
│   │   ├── backupManager.ts  # 备份管理
│   │   └── filePicker.ts     # 文件选择器
│   ├── store/                # 状态管理
│   ├── utils/                # 工具函数
│   │   ├── timeFormat.ts     # 时间格式化
│   │   └── zipUtil.ts        # ZIP 压缩/解压
│   ├── constants/            # 常量定义
│   └── types/                # TypeScript类型
├── assets/                   # 内置资源包
│   ├── index.json
│   ├── dictionary.json
│   └── courses/
│       └── beginner/
├── android/
├── ios/
├── package.json
└── README.md
```

---

**文档版本**: v1.5
**创建日期**: 2026/05/20
**更新日期**: 2026/05/20
**状态**: 待确认

### 更新记录
- v1.5 (2026/05/20): 新增数据持久化、备份导入导出方案，更新技术栈
- v1.4 (2026/05/20): 调整为层级结构（等级→课程→节），支持视频/音频课程类型
- v1.3 (2026/05/20): 调整为全局词典结构，统一管理所有单词数据
- v1.2 (2026/05/20): 调整为完全离线模式，资源包集成在应用内
- v1.1 (2026/05/20): 调整为离线导入模式，新增数据格式说明，移除泰语字母表
- v1.0 (2026/05/20): 初始版本