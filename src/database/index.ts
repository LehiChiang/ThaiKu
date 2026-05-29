import * as SQLite from 'expo-sqlite';
import type { LearningProgress, Vocabulary } from '../types';

let db: SQLite.SQLiteDatabase | null = null;

export const initDatabase = async (): Promise<void> => {
  try {
    db = await SQLite.openDatabaseAsync('thaiku.db');

    // 创建学习进度表
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS learning_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lessonId TEXT NOT NULL,
        levelId TEXT NOT NULL,
        courseId TEXT NOT NULL,
        currentSentenceIndex INTEGER DEFAULT 0,
        completed INTEGER DEFAULT 0,
        lastStudyTime TEXT,
        totalTimeSpent INTEGER DEFAULT 0,
        UNIQUE(lessonId)
      );
    `);

    // 创建生词本表
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS vocabulary (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word TEXT NOT NULL,
        lessonId TEXT NOT NULL,
        addedAt TEXT,
        lastReviewTime TEXT,
        nextReviewAt TEXT,
        reviewInterval INTEGER DEFAULT 5,
        reviewStage INTEGER DEFAULT 1,
        correctStreak INTEGER DEFAULT 0,
        reviewCount INTEGER DEFAULT 0,
        masteryLevel INTEGER DEFAULT 0,
        UNIQUE(word, lessonId)
      );
    `);

    // 迁移：添加缺失的列
    try {
      await db.execAsync(`ALTER TABLE vocabulary ADD COLUMN nextReviewAt TEXT`);
    } catch (e) { /* 列已存在，忽略 */ }
    try {
      await db.execAsync(`ALTER TABLE vocabulary ADD COLUMN reviewInterval INTEGER DEFAULT 5`);
    } catch (e) { /* 列已存在，忽略 */ }
    try {
      await db.execAsync(`ALTER TABLE vocabulary ADD COLUMN reviewStage INTEGER DEFAULT 1`);
    } catch (e) { /* 列已存在，忽略 */ }
    try {
      await db.execAsync(`ALTER TABLE vocabulary ADD COLUMN correctStreak INTEGER DEFAULT 0`);
    } catch (e) { /* 列已存在，忽略 */ }

    // 更新已有的记录，设置默认的下次复习时间
    await db.execAsync(`
      UPDATE vocabulary
      SET nextReviewAt = datetime(addedAt, '+5 minutes'),
          reviewInterval = 5,
          reviewStage = 1,
          correctStreak = 0
      WHERE nextReviewAt IS NULL
    `);

    // 创建课程版本表
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS course_versions (
        levelId TEXT NOT NULL,
        courseId TEXT NOT NULL,
        version TEXT,
        updatedAt TEXT,
        PRIMARY KEY (levelId, courseId)
      );
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};

export const getLearningProgress = async (lessonId: string): Promise<LearningProgress | null> => {
  if (!db) await initDatabase();

  const result = await db!.getFirstAsync<any>(
    'SELECT * FROM learning_progress WHERE lessonId = ?',
    [lessonId]
  );

  if (!result) return null;

  return {
    id: result.id,
    lessonId: result.lessonId,
    levelId: result.levelId,
    courseId: result.courseId,
    currentSentenceIndex: result.currentSentenceIndex,
    completed: result.completed === 1,
    lastStudyTime: result.lastStudyTime,
    totalTimeSpent: result.totalTimeSpent,
  };
};

export const updateLearningProgress = async (progress: LearningProgress): Promise<void> => {
  if (!db) await initDatabase();

  await db!.runAsync(
    `INSERT INTO learning_progress (lessonId, levelId, courseId, currentSentenceIndex, completed, lastStudyTime, totalTimeSpent)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(lessonId) DO UPDATE SET
       currentSentenceIndex = excluded.currentSentenceIndex,
       completed = excluded.completed,
       lastStudyTime = excluded.lastStudyTime,
       totalTimeSpent = excluded.totalTimeSpent`,
    [
      progress.lessonId,
      progress.levelId,
      progress.courseId,
      progress.currentSentenceIndex,
      progress.completed ? 1 : 0,
      progress.lastStudyTime,
      progress.totalTimeSpent,
    ]
  );
};

export const getVocabularyList = async (): Promise<Vocabulary[]> => {
  if (!db) await initDatabase();

  const result = await db!.getAllAsync<any>('SELECT * FROM vocabulary ORDER BY nextReviewAt ASC');

  return result.map(row => ({
    id: row.id,
    word: row.word,
    lessonId: row.lessonId,
    addedAt: row.addedAt,
    lastReviewTime: row.lastReviewTime,
    nextReviewAt: row.nextReviewAt,
    reviewInterval: row.reviewInterval,
    reviewStage: row.reviewStage,
    correctStreak: row.correctStreak,
    reviewCount: row.reviewCount,
    masteryLevel: row.masteryLevel,
  }));
};

export const addVocabulary = async (word: string, lessonId: string): Promise<void> => {
  if (!db) await initDatabase();

  const now = new Date().toISOString();
  const nextReview = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5分钟后

  await db!.runAsync(
    `INSERT INTO vocabulary (word, lessonId, addedAt, lastReviewTime, nextReviewAt, reviewInterval, reviewStage, correctStreak, reviewCount, masteryLevel)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(word, lessonId) DO NOTHING`,
    [word, lessonId, now, now, nextReview, 5, 1, 0, 0]
  );
};

export const removeVocabulary = async (word: string, lessonId: string): Promise<void> => {
  if (!db) await initDatabase();

  await db!.runAsync(
    'DELETE FROM vocabulary WHERE word = ? AND lessonId = ?',
    [word, lessonId]
  );
};

export const updateVocabularyMastery = async (word: string, lessonId: string, masteryLevel: number): Promise<void> => {
  if (!db) await initDatabase();

  await db!.runAsync(
    'UPDATE vocabulary SET masteryLevel = ? WHERE word = ? AND lessonId = ?',
    [masteryLevel, word, lessonId]
  );
};

// 艾宾浩斯间隔（分钟）
const EBBINGHAUS_INTERVALS = [5, 30, 720, 1440, 2880, 5760, 10080, 21600];

// 获取今日到期复习的单词
export const getDueVocabulary = async (): Promise<Vocabulary[]> => {
  if (!db) await initDatabase();

  const now = new Date().toISOString();
  const result = await db!.getAllAsync<any>(
    'SELECT * FROM vocabulary WHERE nextReviewAt <= ? ORDER BY nextReviewAt ASC',
    [now]
  );

  return result.map(row => ({
    id: row.id,
    word: row.word,
    lessonId: row.lessonId,
    addedAt: row.addedAt,
    lastReviewTime: row.lastReviewTime,
    nextReviewAt: row.nextReviewAt,
    reviewInterval: row.reviewInterval,
    reviewStage: row.reviewStage,
    correctStreak: row.correctStreak,
    reviewCount: row.reviewCount,
    masteryLevel: row.masteryLevel,
  }));
};

// 更新复习结果
export const updateReviewResult = async (word: string, lessonId: string, correct: boolean): Promise<void> => {
  if (!db) await initDatabase();

  const vocab = await db!.getFirstAsync<any>(
    'SELECT * FROM vocabulary WHERE word = ? AND lessonId = ?',
    [word, lessonId]
  );

  if (!vocab) return;

  const now = new Date().toISOString();
  let newInterval = vocab.reviewInterval;
  let newStage = vocab.reviewStage;
  let newStreak = vocab.correctStreak;
  let newReviewCount = vocab.reviewCount;

  if (correct) {
    // 答对了，推进到下一阶段
    newStreak = (vocab.correctStreak || 0) + 1;
    newStage = Math.min((vocab.reviewStage || 1) + 1, 8);
    newInterval = EBBINGHAUS_INTERVALS[newStage - 1] || newInterval;
    newReviewCount = (vocab.reviewCount || 0) + 1;
  } else {
    // 答错了，重置到第一阶段
    newStreak = 0;
    newStage = 1;
    newInterval = EBBINGHAUS_INTERVALS[0];
  }

  const nextReview = new Date(Date.now() + newInterval * 60 * 1000).toISOString();

  await db!.runAsync(
    `UPDATE vocabulary
     SET lastReviewTime = ?, nextReviewAt = ?, reviewInterval = ?, reviewStage = ?, correctStreak = ?, reviewCount = ?
     WHERE word = ? AND lessonId = ?`,
    [now, nextReview, newInterval, newStage, newStreak, newReviewCount, word, lessonId]
  );
};

export const exportDatabase = async (): Promise<string> => {
  if (!db) await initDatabase();

  const progress = await db!.getAllAsync<any>('SELECT * FROM learning_progress');
  const vocabulary = await db!.getAllAsync<any>('SELECT * FROM vocabulary');

  return JSON.stringify({
    version: '1.0',
    exportedAt: new Date().toISOString(),
    learningProgress: progress,
    vocabulary: vocabulary,
  }, null, 2);
};

// 课程版本管理
export const saveCourseVersion = async (levelId: string, courseId: string, version: string): Promise<void> => {
  if (!db) await initDatabase();

  const now = new Date().toISOString();
  await db!.runAsync(
    `INSERT INTO course_versions (levelId, courseId, version, updatedAt)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(levelId, courseId) DO UPDATE SET
       version = excluded.version,
       updatedAt = excluded.updatedAt`,
    [levelId, courseId, version, now]
  );
};

export const getCourseVersion = async (levelId: string, courseId: string): Promise<string | null> => {
  if (!db) await initDatabase();

  const result = await db!.getFirstAsync<any>(
    'SELECT version FROM course_versions WHERE levelId = ? AND courseId = ?',
    [levelId, courseId]
  );

  return result?.version || null;
};

export const isCourseUpdate = async (levelId: string, courseId: string, newVersion: string): Promise<boolean> => {
  const currentVersion = await getCourseVersion(levelId, courseId);

  if (!currentVersion) {
    return false; // 新课程，不是更新
  }

  // 简单版本比较
  return currentVersion !== newVersion;
};