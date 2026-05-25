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
import lesson13 from '../../assets/courses/beginner/course_02/lessons/lesson_13/sentences.json';
import lesson19 from '../../assets/courses/beginner/course_04/lessons/lesson_19/sentences.json';
import lesson20 from '../../assets/courses/beginner/course_04/lessons/lesson_20/sentences.json';
import lesson21 from '../../assets/courses/beginner/course_04/lessons/lesson_21/sentences.json';

// 音频课程数据
import lessonAudio01 from '../../assets/courses/beginner/course_audio_01/lessons/lesson_audio_01/sentences.json';
import lessonAudio02 from '../../assets/courses/beginner/course_audio_01/lessons/lesson_audio_02/sentences.json';
import lessonAudio03 from '../../assets/courses/beginner/course_audio_01/lessons/lesson_audio_03/sentences.json';
import lessonAudio04 from '../../assets/courses/intermediate/course_audio_02/lessons/lesson_audio_04/sentences.json';
import lessonAudio05 from '../../assets/courses/intermediate/course_audio_02/lessons/lesson_audio_05/sentences.json';
import lessonAudio06 from '../../assets/courses/advanced/course_audio_03/lessons/lesson_audio_06/sentences.json';
import lessonAudio07 from '../../assets/courses/advanced/course_audio_03/lessons/lesson_audio_07/sentences.json';

// 文档课程数据
import lessonDoc01 from '../../assets/courses/beginner/course_doc_01/lessons/lesson_doc_01/sentences.json';
import lessonDoc02 from '../../assets/courses/beginner/course_doc_01/lessons/lesson_doc_02/sentences.json';
import lessonDoc03 from '../../assets/courses/beginner/course_doc_01/lessons/lesson_doc_03/sentences.json';
import lessonDoc04 from '../../assets/courses/advanced/course_doc_02/lessons/lesson_doc_04/sentences.json';
import lessonDoc05 from '../../assets/courses/advanced/course_doc_02/lessons/lesson_doc_05/sentences.json';

// 数据映射表
const lessonDataMap: Record<string, any> = {
  // 视频课程
  lesson_01: lesson01,
  lesson_02: lesson02,
  lesson_03: lesson03,
  lesson_04: lesson04,
  lesson_05: lesson05,
  lesson_07: lesson07,
  lesson_09: lesson09,
  lesson_10: lesson10,
  lesson_13: lesson13,
  lesson_19: lesson19,
  lesson_20: lesson20,
  lesson_21: lesson21,

  // 音频课程
  lesson_audio_01: lessonAudio01,
  lesson_audio_02: lessonAudio02,
  lesson_audio_03: lessonAudio03,
  lesson_audio_04: lessonAudio04,
  lesson_audio_05: lessonAudio05,
  lesson_audio_06: lessonAudio06,
  lesson_audio_07: lessonAudio07,

  // 文档课程
  lesson_doc_01: lessonDoc01,
  lesson_doc_02: lessonDoc02,
  lesson_doc_03: lessonDoc03,
  lesson_doc_04: lessonDoc04,
  lesson_doc_05: lessonDoc05,
};

export const getLessonData = (lessonId: string) => {
  return lessonDataMap[lessonId] || null;
};
