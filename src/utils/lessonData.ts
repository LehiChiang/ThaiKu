// 课程数据加载工具
// 静态导入所有课时数据

import lesson01 from '../../assets/courses/beginner/course_01/lessons/lesson_01/sentences.json';
import lesson02 from '../../assets/courses/beginner/course_01/lessons/lesson_02/sentences.json';
import lesson03 from '../../assets/courses/beginner/course_01/lessons/lesson_03/sentences.json';
import lesson04 from '../../assets/courses/beginner/course_02/lessons/lesson_04/sentences.json';
import lesson05 from '../../assets/courses/beginner/course_02/lessons/lesson_05/sentences.json';
import lesson07 from '../../assets/courses/beginner/course_03/lessons/lesson_07/sentences.json';
import lesson09 from '../../assets/courses/beginner/course_03/lessons/lesson_09/sentences.json';
import lesson10 from '../../assets/courses/beginner/course_04/lessons/lesson_10/sentences.json';

// 数据映射表
const lessonDataMap: Record<string, any> = {
  lesson_01: lesson01,
  lesson_02: lesson02,
  lesson_03: lesson03,
  lesson_04: lesson04,
  lesson_05: lesson05,
  lesson_07: lesson07,
  lesson_09: lesson09,
  lesson_10: lesson10,
};

export const getLessonData = (lessonId: string) => {
  return lessonDataMap[lessonId] || null;
};

export const hasLessonData = (lessonId: string) => {
  return !!lessonDataMap[lessonId];
};
