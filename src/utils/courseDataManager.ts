import * as FileSystem from 'expo-file-system/legacy';
import type { Level, Course, Lesson, Sentence } from '../types';

// 课程数据存储路径
const COURSES_DIR = `${FileSystem.documentDirectory}courses/`;
const INDEX_FILE = `${COURSES_DIR}index.json`;

// 默认 assets 路径
const ASSETS_COURSES_DIR = `${FileSystem.bundleDirectory}assets/courses/`;

// 动态课程数据缓存
let courseIndexCache: Level[] | null = null;
let lessonDataCache: Record<string, any> = {};

/**
 * 初始化课程目录
 */
export const initCoursesDirectory = async (): Promise<void> => {
  const dirInfo = await FileSystem.getInfoAsync(COURSES_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(COURSES_DIR, { intermediates: true });
  }
};

/**
 * 从文档目录或 assets 加载课程索引
 */
export const loadCourseIndex = async (): Promise<Level[]> => {
  // 如果有缓存，直接返回
  if (courseIndexCache) {
    console.log('[CourseManager] 使用缓存的课程索引');
    return courseIndexCache;
  }

  console.log('[CourseManager] INDEX_FILE:', INDEX_FILE);

  try {
    // 优先从文档目录加载
    const indexInfo = await FileSystem.getInfoAsync(INDEX_FILE);
    console.log('[CourseManager] 文档目录索引文件存在:', indexInfo.exists);

    if (indexInfo.exists) {
      const content = await FileSystem.readAsStringAsync(INDEX_FILE);
      const data = JSON.parse(content);
      courseIndexCache = data.levels || [];
      console.log('[CourseManager] 从文档目录加载了课程索引，课程数量:', courseIndexCache.length);
      return courseIndexCache;
    }
  } catch (error) {
    console.error('加载课程索引失败，使用静态资源:', error);
  }

  // 回退到静态导入
  console.log('[CourseManager] 使用静态资源加载课程索引');
  try {
    const staticData = require('../../assets/index.json');
    courseIndexCache = staticData.levels || [];
    console.log('[CourseManager] 从静态资源加载了课程索引，课程数量:', courseIndexCache.length);
    return courseIndexCache;
  } catch (error) {
    console.error('加载静态课程索引失败:', error);
    return [];
  }
};

/**
 * 刷新课程索引缓存
 */
export const refreshCourseIndex = async (): Promise<Level[]> => {
  courseIndexCache = null;
  lessonDataCache = {};
  return loadCourseIndex();
};

/**
 * 根据课程和课时ID获取课时数据路径
 */
const getLessonPath = (courseId: string, lessonId: string, file: string = 'sentences.json'): string => {
  // 尝试动态课程目录
  const dynamicPath = `${COURSES_DIR}${courseId}/lessons/${lessonId}/${file}`;
  return dynamicPath;
};

/**
 * 动态读取课时句子数据
 */
export const loadLessonData = async (lessonId: string): Promise<{ sentences: Sentence[] } | null> => {
  // 检查缓存
  if (lessonDataCache[lessonId]) {
    return lessonDataCache[lessonId];
  }

  // 首先尝试从文档目录加载
  try {
    const coursesIndex = await loadCourseIndex();

    // 查找课时所属的课程
    let foundPath: string | null = null;
    for (const level of coursesIndex) {
      for (const course of level.courses) {
        const lesson = course.lessons.find(l => l.id === lessonId);
        if (lesson) {
          foundPath = `${COURSES_DIR}${course.id}/lessons/${lessonId}/sentences.json`;
          break;
        }
      }
      if (foundPath) break;
    }

    if (foundPath) {
      const info = await FileSystem.getInfoAsync(foundPath);
      if (info.exists) {
        const content = await FileSystem.readAsStringAsync(foundPath);
        const data = JSON.parse(content);
        lessonDataCache[lessonId] = data;
        return data;
      }
    }
  } catch (error) {
    console.error('从文档目录加载课时数据失败:', error);
  }

  // 回退到静态导入（保持向后兼容）
  try {
    const { getLessonData: staticGetLessonData } = require('./lessonData');
    const data = staticGetLessonData(lessonId);
    if (data) {
      lessonDataCache[lessonId] = data;
      return data;
    }
  } catch (error) {
    console.error('从静态资源加载课时数据失败:', error);
  }

  return null;
};

/**
 * 动态读取课时元数据
 */
export const loadLessonMeta = async (lessonId: string): Promise<any | null> => {
  try {
    const coursesIndex = await loadCourseIndex();

    // 查找课时所属的课程
    let foundPath: string | null = null;
    for (const level of coursesIndex) {
      for (const course of level.courses) {
        const lesson = course.lessons.find(l => l.id === lessonId);
        if (lesson) {
          foundPath = `${COURSES_DIR}${course.id}/lessons/${lessonId}/meta.json`;
          break;
        }
      }
      if (foundPath) break;
    }

    if (foundPath) {
      const info = await FileSystem.getInfoAsync(foundPath);
      if (info.exists) {
        const content = await FileSystem.readAsStringAsync(foundPath);
        return JSON.parse(content);
      }
    }
  } catch (error) {
    console.error('加载课时元数据失败:', error);
  }

  return null;
};

/**
 * 查找课程是否存在
 */
export const findCourse = async (levelId: string, courseId: string): Promise<Course | null> => {
  const levels = await loadCourseIndex();
  const level = levels.find(l => l.id === levelId);
  if (!level) return null;
  return level.courses.find(c => c.id === courseId) || null;
};

/**
 * 查找课时是否存在
 */
export const findLesson = async (lessonId: string): Promise<{ level: Level; course: Course; lesson: Lesson } | null> => {
  const levels = await loadCourseIndex();
  for (const level of levels) {
    for (const course of level.courses) {
      const lesson = course.lessons.find(l => l.id === lessonId);
      if (lesson) {
        return { level, course, lesson };
      }
    }
  }
  return null;
};

/**
 * 保存课程索引
 */
export const saveCourseIndex = async (levels: Level[]): Promise<void> => {
  await initCoursesDirectory();
  const data = { version: '1.0', levels };
  const jsonStr = JSON.stringify(data, null, 2);
  console.log('[CourseManager] 保存课程索引到:', INDEX_FILE);
  console.log('[CourseManager] 保存的课程数量:', levels.length);
  await FileSystem.writeAsStringAsync(INDEX_FILE, jsonStr);

  // 验证保存是否成功
  const savedContent = await FileSystem.readAsStringAsync(INDEX_FILE);
  const savedData = JSON.parse(savedContent);
  console.log('[CourseManager] 保存验证: 文档目录课程数量 =', savedData.levels.length);

  courseIndexCache = levels;
};

/**
 * 保存课程数据
 */
export const saveCourseData = async (
  levelId: string,
  courseId: string,
  lessonId: string,
  files: Record<string, string>
): Promise<void> => {
  const courseDir = `${COURSES_DIR}${courseId}/lessons/${lessonId}/`;
  await FileSystem.makeDirectoryAsync(courseDir, { intermediates: true });

  for (const [filename, content] of Object.entries(files)) {
    const filePath = `${courseDir}${filename}`;
    await FileSystem.writeAsStringAsync(filePath, content);
  }
};

/**
 * 删除课程
 */
export const deleteCourse = async (levelId: string, courseId: string): Promise<void> => {
  const courseDir = `${COURSES_DIR}${courseId}`;
  const info = await FileSystem.getInfoAsync(courseDir);
  if (info.exists) {
    await FileSystem.deleteAsync(courseDir, { idempotent: true });
    // 刷新索引
    const levels = await loadCourseIndex();
    const updatedLevels = levels.map(level => ({
      ...level,
      courses: level.courses.filter(c => c.id !== courseId)
    })).filter(level => level.courses.length > 0);

    await saveCourseIndex(updatedLevels);
  }
};

/**
 * 检测课程是否为动态导入
 */
export const isDynamicCourse = async (courseId: string): Promise<boolean> => {
  const courseDir = `${COURSES_DIR}${courseId}`;
  const info = await FileSystem.getInfoAsync(courseDir);
  return info.exists;
};