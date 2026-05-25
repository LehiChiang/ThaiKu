import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export interface Level {
  id: string;
  title: string;
  description: string;
  courses: Course[];
}

export interface Course {
  id: string;
  title: string;
  type: 'video' | 'audio' | 'document';
  thumbnail?: string;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  scene: string;
  duration: number;
  thumbnail?: string;
  videoUrl?: string;
  audioUrl?: string;
  documentUrl?: string;
  audioCover?: string;
}

export interface Sentence {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  translation: string;
  wordRefs: WordRef[];
}

export interface WordRef {
  word: string;
  start: number;
  end: number;
}

export interface WordDefinition {
  pronunciation: string;
  meaning: string;
  partOfSpeech?: string;
  usage?: string;
  examples: WordExample[];
}

export interface WordExample {
  sceneId?: string;
  sentence: string;
  translation: string;
}

export interface LearningProgress {
  id?: number;
  lessonId: string;
  levelId: string;
  courseId: string;
  currentSentenceIndex: number;
  completed: boolean;
  lastStudyTime: string;
  totalTimeSpent: number;
}

export interface Vocabulary {
  id?: number;
  word: string;
  lessonId: string;
  addedAt: string;
  lastReviewTime: string;
  nextReviewAt: string;
  reviewInterval: number; // 复习间隔（分钟）
  reviewStage: number; // 当前轮次（1-8）
  correctStreak: number; // 连续正确次数
  reviewCount: number;
  masteryLevel: number; // 0-5
}

export interface RootStackParamList {
  Home: undefined;
  Course: { levelId: string; level: Level };
  LessonList: { levelId: string; course: Course };
  Learning: {
    lessonId: string;
    courseId: string;
    levelId: string;
    lesson: Lesson;
    course: Course;
  };
  FullText: { sentences: Sentence[] };
  Vocab: undefined;
  Settings: undefined;
  [key: string]: any;
}