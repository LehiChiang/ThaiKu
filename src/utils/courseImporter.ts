import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import JSZip from 'jszip';
import type { Level, Course, Lesson } from '../types';
import { loadCourseIndex, saveCourseIndex } from './courseDataManager';
import { saveCourseVersion, getCourseVersion } from '../database';

// 课程数据存储路径
const COURSES_DIR = `${FileSystem.documentDirectory}courses/`;
const INDEX_FILE = `${FileSystem.documentDirectory}index.json`;

// 临时解压目录
const TEMP_DIR = `${FileSystem.cacheDirectory}course_import/`;

// 课程冲突信息
export interface CourseConflict {
  levelId: string;
  courseId: string;
  courseTitle: string;
  oldVersion?: string;
  newVersion?: string;
  existingLessons: number;
  newLessons: number;
}

// 导入结果
export interface ImportResult {
  success: boolean;
  addedCourses: string[];
  updatedCourses: CourseConflict[];
  skippedCourses: string[];
  errors: string[];
}

// 文件大小限制 (50MB)
const MAX_FILE_SIZE = 50 * 1024 * 1024;

/**
 * 清理临时目录
 */
const cleanupTempDir = async (): Promise<void> => {
  try {
    const info = await FileSystem.getInfoAsync(TEMP_DIR);
    if (info.exists) {
      await FileSystem.deleteAsync(TEMP_DIR, { idempotent: true });
    }
  } catch (error) {
    console.error('清理临时目录失败:', error);
  }
};

/**
 * 确保目录存在
 */
const ensureDirectory = async (dir: string): Promise<void> => {
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
};

/**
 * 解压 ZIP 课程包
 */
export const unzipCoursePackage = async (fileUri: string): Promise<JSZip> => {
  await cleanupTempDir();

  // 检查文件大小
  const fileInfo = await FileSystem.getInfoAsync(fileUri);
  if (fileInfo.size && fileInfo.size > MAX_FILE_SIZE) {
    throw new Error(`文件过大，最大支持 ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  // 读取 ZIP 文件
  const base64 = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // 使用 JSZip 解压
  const zip = await JSZip.loadAsync(base64, { base64: true });
  return zip;
};

/**
 * 验证课程包格式
 *
 * 期望的 ZIP 结构：
 * course_package.zip
 * ├── index.json
 * └── courses/
 *     └── {level}/
 *         └── {course_id}/
 *             └── lessons/
 *                 └── {lesson_id}/
 *                     ├── meta.json
 *                     └── sentences.json
 */
export const validateCoursePackage = async (zip: JSZip): Promise<{ valid: boolean; errors: string[] }> => {
  const errors: string[] = [];
  const allFiles = Object.keys(zip.files);

  console.log('[Import] ZIP 文件列表 (前20个):', allFiles.slice(0, 20));

  // 1. 检查 index.json
  const indexFile = allFiles.find(f => f.endsWith('index.json'));
  if (!indexFile) {
    errors.push('缺少 index.json 文件');
    return { valid: false, errors };
  }

  try {
    const content = await zip.file(indexFile)!.async('string');
    const data = JSON.parse(content);

    // 2. 验证 levels 结构
    if (!data.levels || !Array.isArray(data.levels) || data.levels.length === 0) {
      errors.push('levels 为空或格式错误');
      return { valid: false, errors };
    }

    // 3. 验证每个课程
    for (const level of data.levels) {
      if (!level.id || !level.title || !Array.isArray(level.courses)) {
        errors.push(`Level ${level.id || 'unknown'} 格式错误`);
        continue;
      }

      for (const course of level.courses) {
        if (!course.id || !course.title || !Array.isArray(course.lessons)) {
          errors.push(`课程 ${course.id || 'unknown'} 格式错误`);
          continue;
        }

        // 4. 验证每个课时的数据文件
        for (const lesson of course.lessons) {
          if (!lesson.id) {
            errors.push(`课程 ${course.id} 有课时缺少 id`);
            continue;
          }

          // 查找课时文件（支持多种路径格式）
          const metaPattern = `${lesson.id}/meta.json`;
          const sentencesPattern = `${lesson.id}/sentences.json`;

          const metaFile = allFiles.find(f => f.endsWith(metaPattern));
          const sentencesFile = allFiles.find(f => f.endsWith(sentencesPattern));

          if (!metaFile) {
            errors.push(`课时 ${lesson.id} 缺少 meta.json`);
          }
          if (!sentencesFile) {
            errors.push(`课时 ${lesson.id} 缺少 sentences.json`);
          }
        }
      }
    }
  } catch (error) {
    errors.push(`解析 index.json 失败: ${error instanceof Error ? error.message : '未知错误'}`);
    return { valid: false, errors };
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * 解析课程索引文件
 */
export const parseCourseIndex = async (zip: JSZip): Promise<any | null> => {
  try {
    const allFiles = Object.keys(zip.files);
    const indexFile = allFiles.find(f => f.endsWith('index.json'));

    if (!indexFile) {
      throw new Error('课程包中缺少 index.json 文件');
    }

    const content = await zip.file(indexFile)!.async('string');
    const data = JSON.parse(content);

    if (!data.levels || !Array.isArray(data.levels)) {
      throw new Error('课程包格式错误: 缺少 levels 数组');
    }

    return data;
  } catch (error) {
    console.error('解析课程索引失败:', error);
    throw error;
  }
};

/**
 * 读取课时数据
 */
export const readLessonData = async (
  zip: JSZip,
  allFiles: string[],
  lessonId: string
): Promise<{ meta: any; sentences: any; metaPath: string; sentencesPath: string }> => {
  const metaPath = allFiles.find(f => f.endsWith(`${lessonId}/meta.json`));
  const sentencesPath = allFiles.find(f => f.endsWith(`${lessonId}/sentences.json`));

  if (!metaPath || !sentencesPath) {
    throw new Error(`课时 ${lessonId} 数据文件不完整`);
  }

  const meta = JSON.parse(await zip.file(metaPath)!.async('string'));
  const sentences = JSON.parse(await zip.file(sentencesPath)!.async('string'));

  return { meta, sentences, metaPath, sentencesPath };
};

/**
 * 检测课程冲突
 */
export const detectConflicts = async (newLevels: Level[]): Promise<CourseConflict[]> => {
  const conflicts: CourseConflict[] = [];
  const currentLevels = await loadCourseIndex();

  for (const newLevel of newLevels) {
    for (const newCourse of newLevel.courses) {
      // 在现有课程中查找
      for (const currentLevel of currentLevels) {
        const existingCourse = currentLevel.courses.find(c => c.id === newCourse.id);
        if (existingCourse) {
          const oldVersion = await getCourseVersion(currentLevel.id, newCourse.id);
          conflicts.push({
            levelId: newLevel.id,
            courseId: newCourse.id,
            courseTitle: newCourse.title,
            oldVersion,
            newVersion: (newCourse as any).version,
            existingLessons: existingCourse.lessons.length,
            newLessons: newCourse.lessons.length,
          });
          break;
        }
      }
    }
  }

  return conflicts;
};

/**
 * 复制课时数据到文档目录
 */
const copyLessonData = async (
  zip: JSZip,
  allFiles: string[],
  levelId: string,
  courseId: string,
  lessonId: string
): Promise<void> => {
  const targetDir = `${COURSES_DIR}${levelId}/${courseId}/lessons/${lessonId}/`;
  console.log(`[Import] 创建目录: ${targetDir}`);
  await ensureDirectory(targetDir);

  // 查找并复制 meta.json（处理 assets/ 前缀）
  const metaPath = allFiles.find(f => f.endsWith(`${lessonId}/meta.json`));
  if (metaPath) {
    console.log(`[Import] 找到 meta.json: ${metaPath}`);
    const content = await zip.file(metaPath)!.async('string');
    await FileSystem.writeAsStringAsync(`${targetDir}meta.json`, content);
  } else {
    throw new Error(`找不到 ${lessonId}/meta.json`);
  }

  // 查找并复制 sentences.json
  const sentencesPath = allFiles.find(f => f.endsWith(`${lessonId}/sentences.json`));
  if (sentencesPath) {
    console.log(`[Import] 找到 sentences.json: ${sentencesPath}`);
    const content = await zip.file(sentencesPath)!.async('string');
    await FileSystem.writeAsStringAsync(`${targetDir}sentences.json`, content);
  } else {
    throw new Error(`找不到 ${lessonId}/sentences.json`);
  }
};

/**
 * 合并或覆盖课程数据
 *
 * 合并逻辑（keep 模式）：
 * 1. index.json 取并集（level + course 维度）
 * 2. 相同 course_id 时，以导入包的版本为主（整个 course 替换）
 * 3. 课时合并：以导入包的课时为主，追加现有课程中不存在的课时
 */
const mergeOrOverwriteCourses = async (
  newLevels: Level[],
  zip: JSZip,
  conflictResolution: 'overwrite' | 'skip' | 'keep'
): Promise<ImportResult> => {
  const result: ImportResult = {
    success: true,
    addedCourses: [],
    updatedCourses: [],
    skippedCourses: [],
    errors: [],
  };

  const allFiles = Object.keys(zip.files);

  if (conflictResolution === 'overwrite') {
    // 完全覆盖模式：只保留导入包中的内容
    console.log('[Import] 使用完全覆盖模式');

    // 复制课时数据
    for (const newLevel of newLevels) {
      for (const newCourse of newLevel.courses) {
        result.addedCourses.push(newCourse.id);

        for (const lesson of newCourse.lessons) {
          try {
            await copyLessonData(zip, allFiles, newLevel.id, newCourse.id, lesson.id);
          } catch (error) {
            console.error(`复制课时 ${lesson.id} 数据失败:`, error);
            result.errors.push(`课时 ${lesson.id}: ${error instanceof Error ? error.message : '未知错误'}`);
          }
        }

        await saveCourseVersion(newLevel.id, newCourse.id, (newCourse as any).version || '1.0');
      }
    }

    // 只保存导入包中的级别
    await saveCourseIndex(newLevels);
    console.log('[Import] 覆盖完成，保存级别数量:', newLevels.length);
  } else if (conflictResolution === 'keep') {
    // 合并模式：index.json 取并集，相同 course_id 以导入包为主
    console.log('[Import] 使用合并模式');
    const currentLevels = await loadCourseIndex();

    // 用 Map 来管理级别，便于合并
    const levelMap = new Map<string, Level>();

    // 1. 先把现有级别放入 map
    currentLevels.forEach(level => {
      levelMap.set(level.id, {
        ...level,
        courses: [...level.courses],
      });
    });

    // 2. 合并导入包中的级别和课程
    for (const newLevel of newLevels) {
      let targetLevel = levelMap.get(newLevel.id);

      // 如果级别不存在，创建新的
      if (!targetLevel) {
        targetLevel = {
          id: newLevel.id,
          title: newLevel.title,
          description: newLevel.description,
          courses: [],
        };
        levelMap.set(newLevel.id, targetLevel);
      }

      // 合并课程
      for (const newCourse of newLevel.courses) {
        const existingCourseIndex = targetLevel.courses.findIndex(c => c.id === newCourse.id);

        if (existingCourseIndex !== -1) {
          // 相同 course_id：以导入包的版本为主
          console.log(`[Import] 课程 ${newCourse.id} 已存在，使用导入包版本替换`);
          const existingCourse = targetLevel.courses[existingCourseIndex];

          // 课时合并：导入包的课时 + 现有课程中不存在于导入包的课时
          const newLessonIds = new Set(newCourse.lessons.map(l => l.id));
          const additionalLessons = existingCourse.lessons.filter(l => !newLessonIds.has(l.id));

          const mergedCourse: Course = {
            ...newCourse,
            lessons: [...newCourse.lessons, ...additionalLessons],
          };

          targetLevel.courses[existingCourseIndex] = mergedCourse;
          result.updatedCourses.push({
            levelId: newLevel.id,
            courseId: newCourse.id,
            courseTitle: newCourse.title,
            oldVersion: await getCourseVersion(newLevel.id, newCourse.id).catch(() => undefined),
            newVersion: (newCourse as any).version || '1.0',
            existingLessons: existingCourse.lessons.length,
            newLessons: newCourse.lessons.length,
          });
        } else {
          // 新课程，直接添加
          targetLevel.courses.push(newCourse);
          result.addedCourses.push(newCourse.id);
        }

        // 复制课时数据（导入包中的课时）
        for (const lesson of newCourse.lessons) {
          try {
            await copyLessonData(zip, allFiles, newLevel.id, newCourse.id, lesson.id);
          } catch (error) {
            console.error(`复制课时 ${lesson.id} 数据失败:`, error);
            result.errors.push(`课时 ${lesson.id}: ${error instanceof Error ? error.message : '未知错误'}`);
          }
        }

        await saveCourseVersion(newLevel.id, newCourse.id, (newCourse as any).version || '1.0');
      }
    }

    const updatedLevels = Array.from(levelMap.values());
    await saveCourseIndex(updatedLevels);
    console.log('[Import] 合并完成，最终级别数量:', updatedLevels.length);
  } else {
    // skip 模式：跳过冲突课程
    console.log('[Import] 使用跳过模式');
    const currentLevels = await loadCourseIndex();
    const levelMap = new Map<string, Level>();

    currentLevels.forEach(level => {
      levelMap.set(level.id, {
        ...level,
        courses: [...level.courses],
      });
    });

    for (const newLevel of newLevels) {
      let targetLevel = levelMap.get(newLevel.id);

      if (!targetLevel) {
        targetLevel = {
          id: newLevel.id,
          title: newLevel.title,
          description: newLevel.description,
          courses: [],
        };
        levelMap.set(newLevel.id, targetLevel);
      }

      for (const newCourse of newLevel.courses) {
        const existingCourseIndex = targetLevel.courses.findIndex(c => c.id === newCourse.id);

        if (existingCourseIndex !== -1) {
          // 跳过冲突课程
          result.skippedCourses.push(newCourse.id);
          continue;
        }

        targetLevel.courses.push(newCourse);
        result.addedCourses.push(newCourse.id);

        for (const lesson of newCourse.lessons) {
          try {
            await copyLessonData(zip, allFiles, newLevel.id, newCourse.id, lesson.id);
          } catch (error) {
            console.error(`复制课时 ${lesson.id} 数据失败:`, error);
            result.errors.push(`课时 ${lesson.id}: ${error instanceof Error ? error.message : '未知错误'}`);
          }
        }

        await saveCourseVersion(newLevel.id, newCourse.id, (newCourse as any).version || '1.0');
      }
    }

    const updatedLevels = Array.from(levelMap.values());
    await saveCourseIndex(updatedLevels);
  }

  result.success = result.errors.length === 0;
  return result;
};

/**
 * 导入课程包主函数
 */
export const importCoursePackage = async (
  conflictResolution: 'overwrite' | 'skip' | 'keep' = 'overwrite'
): Promise<ImportResult> => {
  let zip: JSZip | null = null;

  try {
    console.log('[Import] 开始导入课程包...');
    console.log('[Import] 冲突处理方式:', conflictResolution);

    // 1. 选择文件
    console.log('[Import] 打开文件选择器...');
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/zip', 'application/x-zip-compressed'],
      copyToCacheDirectory: true,
    });

    console.log('[Import] 文件选择结果:', result);

    if (result.canceled || !result.assets || result.assets.length === 0) {
      console.log('[Import] 用户取消选择文件');
      return {
        success: false,
        addedCourses: [],
        updatedCourses: [],
        skippedCourses: [],
        errors: ['未选择文件'],
      };
    }

    const fileUri = result.assets[0].uri;
    console.log('[Import] 选中的文件:', fileUri);

    // 2. 解压 ZIP 包
    console.log('[Import] 开始解压文件...');
    zip = await unzipCoursePackage(fileUri);
    console.log('[Import] 解压完成');

    // 3. 验证课程包格式
    console.log('[Import] 验证课程包格式...');
    const validation = await validateCoursePackage(zip);
    if (!validation.valid) {
      console.error('[Import] 格式验证失败:', validation.errors);
      return {
        success: false,
        addedCourses: [],
        updatedCourses: [],
        skippedCourses: [],
        errors: validation.errors,
      };
    }
    console.log('[Import] 格式验证通过');

    // 4. 解析课程索引
    const packageData = await parseCourseIndex(zip);
    if (!packageData) {
      throw new Error('无法解析课程包');
    }

    // 5. 检测冲突
    const conflicts = await detectConflicts(packageData.levels);

    // 如果有冲突且用户选择跳过，则提示用户
    if (conflicts.length > 0 && conflictResolution === 'skip') {
      return {
        success: false,
        addedCourses: [],
        updatedCourses: conflicts,
        skippedCourses: [],
        errors: ['检测到课程冲突，请选择处理方式'],
      };
    }

    // 6. 合并或覆盖课程
    const importResult = await mergeOrOverwriteCourses(packageData.levels, zip, conflictResolution);

    return importResult;
  } catch (error) {
    console.error('导入课程包失败:', error);
    return {
      success: false,
      addedCourses: [],
      updatedCourses: [],
      skippedCourses: [],
      errors: [error instanceof Error ? error.message : '未知错误'],
    };
  } finally {
    // 7. 清理临时文件
    if (zip) {
      zip = null;
    }
    await cleanupTempDir();
  }
};
