# ThaiKu - 泰语学习应用

一个基于 React Native 的离线泰语学习应用，支持场景化逐句学习、单词查询和生词本管理。

## 功能特性

- 📚 **场景化学习**: 通过真实场景音视频内容逐句学习泰语
- 🔤 **单词查询**: 点击句子中的单词查看词意、用法和例句
- 📖 **生词本**: 自动保存生词，追踪学习进度
- 💾 **数据持久化**: 本地 SQLite 数据库存储学习数据
- 🔄 **备份恢复**: 支持导出备份和恢复导入

## 项目结构

```
ThaiKu/
├── src/
│   ├── screens/          # 页面组件
│   ├── database/         # SQLite 数据库
│   ├── constants/        # 常量和主题
│   └── types/            # TypeScript 类型定义
├── assets/               # 资源文件
│   ├── index.json        # 课程索引
│   ├── dictionary.json   # 全局词典
│   └── courses/          # 课程数据
├── App.tsx               # 应用入口
└── package.json          # 依赖配置
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

- **框架**: React Native + Expo
- **语言**: TypeScript
- **导航**: React Navigation
- **UI**: React Native Paper
- **数据库**: expo-sqlite
- **视频播放**: expo-av
- **文件系统**: expo-file-system

## 数据格式

### 课程索引 (assets/index.json)
```json
{
  "version": "1.0",
  "levels": [
    {
      "id": "beginner",
      "title": "初级",
      "description": "适合零基础学习者",
      "courses": [...]
    }
  ]
}
```

### 句子数据 (assets/courses/.../sentences.json)
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

## 许可证

MIT License