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
import type { RootStackParamList, Level, Course } from '../types';

type CourseScreenRouteProp = RouteProp<RootStackParamList, 'Course'>;
type CourseScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Course'>;

export default function CourseScreen() {
  const navigation = useNavigation<CourseScreenNavigationProp>();
  const route = useRoute<CourseScreenRouteProp>();
  const { levelId, level } = route.params;

  const renderCourse = ({ item, index }: { item: Course; index: number }) => (
    <TouchableOpacity
      style={styles.courseCard}
      activeOpacity={0.8}
      onPress={() => navigation.navigate('LessonList', { levelId, course: item })}
    >
      <View style={styles.courseIcon}>
        <Ionicons
          name={item.type === 'video' ? 'play-circle' : 'musical-notes'}
          size={32}
          color="#0066CC"
        />
      </View>
      <View style={styles.courseContent}>
        <Text style={styles.courseTitle}>{item.title}</Text>
        <View style={styles.courseMeta}>
          <View style={styles.courseMetaItem}>
            <Ionicons name="layers-outline" size={14} color="#999" />
            <Text style={styles.courseMetaText}>{item.lessons.length} 节</Text>
          </View>
          <View style={styles.courseMetaItem}>
            <Ionicons name="time-outline" size={14} color="#999" />
            <Text style={styles.courseMetaText}>
              {item.lessons.reduce((sum, l) => sum + l.duration, 0)} 分钟
            </Text>
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
            <Text style={styles.headerTitle}>{level.title}</Text>
            <Text style={styles.headerSubtitle}>
              {level.courses.length} 门课程 · {level.courses.reduce((sum, c) => sum + c.lessons.length, 0)} 节课时
            </Text>
          </View>
          <View style={styles.headerIcon} />
        </View>

        <FlatList
          data={level.courses}
          renderItem={renderCourse}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="school-outline" size={48} color="#CCC" />
              <Text style={styles.emptyText}>暂无课程</Text>
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
  list: {
    padding: 20,
    paddingBottom: 40,
  },
  courseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  courseIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  courseContent: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  courseMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  courseMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  courseMetaText: {
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