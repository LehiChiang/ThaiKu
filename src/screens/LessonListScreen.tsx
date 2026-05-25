import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList, Course, Lesson } from '../types';

type LessonListScreenRouteProp = RouteProp<RootStackParamList, 'LessonList'>;
type LessonListScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'LessonList'>;

export default function LessonListScreen() {
  const navigation = useNavigation<LessonListScreenNavigationProp>();
  const route = useRoute<LessonListScreenRouteProp>();
  const { levelId, course } = route.params;

  const renderLesson = ({ item, index }: { item: Lesson; index: number }) => (
    <TouchableOpacity
      style={styles.lessonItem}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('Learning', {
        lessonId: item.id,
        courseId: course.id,
        levelId: levelId,
        lesson: item,
        course: course,
      })}
    >
      <View style={styles.lessonNumber}>
        <Text style={styles.lessonNumberText}>{index + 1}</Text>
      </View>
      <View style={styles.lessonContent}>
        <Text style={styles.lessonTitle}>{item.title}</Text>
        <View style={styles.lessonMeta}>
          <View style={styles.lessonMetaItem}>
            <Ionicons name="time-outline" size={14} color="#999" />
            <Text style={styles.lessonMetaText}>{item.duration}分钟</Text>
          </View>
          <View style={styles.lessonMetaItem}>
            <Ionicons name="location-outline" size={14} color="#999" />
            <Text style={styles.lessonMetaText}>{item.scene}</Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#CCC" />
    </TouchableOpacity>
  );

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0066CC" />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>{course.title}</Text>
            <Text style={styles.headerSubtitle}>{course.lessons.length} 节课时</Text>
          </View>
          <View style={styles.headerIcon} />
        </View>

        <View style={styles.courseInfo}>
          <View style={styles.courseInfoItem}>
            <Ionicons name={course.type === 'video' ? 'play-circle' : 'musical-notes'} size={20} color="#0066CC" />
            <Text style={styles.courseInfoText}>{course.type === 'video' ? '视频课程' : '音频课程'}</Text>
          </View>
        </View>

        <FlatList
          data={course.lessons}
          renderItem={renderLesson}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={48} color="#CCC" />
              <Text style={styles.emptyText}>暂无课时</Text>
            </View>
          }
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#0066CC',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  headerIcon: {
    width: 40,
  },
  courseInfo: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: -10,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  courseInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  courseInfoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  list: {
    padding: 20,
    paddingBottom: 40,
  },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  lessonNumber: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  lessonNumberText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0066CC',
  },
  lessonContent: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  lessonMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  lessonMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lessonMetaText: {
    fontSize: 13,
    color: '#999',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    color: '#999999',
    marginTop: 16,
  },
});
