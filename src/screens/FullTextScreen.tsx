import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList, Sentence } from '../types';

type FullTextScreenRouteProp = RouteProp<RootStackParamList, 'FullText'>;
type FullTextScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'FullText'>;

export default function FullTextScreen() {
  const navigation = useNavigation<FullTextScreenNavigationProp>();
  const route = useRoute<FullTextScreenRouteProp>();
  const { sentences } = route.params;

  const [showThaiOnly, setShowThaiOnly] = useState(false);

  const renderSentence = ({ item }: { item: Sentence }) => (
    <View style={styles.sentenceBlock}>
      <Text style={styles.thaiText}>{item.text}</Text>
      {!showThaiOnly && (
        <>
          <View style={styles.divider} />
          <Text style={styles.translationText}>{item.translation}</Text>
        </>
      )}
    </View>
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
            <Text style={styles.headerTitle}>全文浏览</Text>
            <Text style={styles.headerSubtitle}>{sentences.length} 句</Text>
          </View>
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={() => setShowThaiOnly(!showThaiOnly)}
          >
            <Ionicons
              name={showThaiOnly ? 'eye-outline' : 'eye-off-outline'}
              size={24}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, !showThaiOnly && styles.toggleButtonActive]}
            onPress={() => setShowThaiOnly(false)}
          >
            <Text style={[styles.toggleButtonText, !showThaiOnly && styles.toggleButtonTextActive]}>
              双语对照
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, showThaiOnly && styles.toggleButtonActive]}
            onPress={() => setShowThaiOnly(true)}
          >
            <Text style={[styles.toggleButtonText, showThaiOnly && styles.toggleButtonTextActive]}>
              仅泰语
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {sentences.map((sentence) => (
            <View key={sentence.id} style={styles.sentenceItem}>
              {renderSentence({ item: sentence })}
            </View>
          ))}
        </ScrollView>
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
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: -10,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#E3F2FD',
  },
  toggleButtonText: {
    fontSize: 14,
    color: '#999999',
    fontWeight: '500',
  },
  toggleButtonTextActive: {
    color: '#0066CC',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sentenceItem: {
    marginBottom: 24,
  },
  sentenceBlock: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  thaiText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0066CC',
    lineHeight: 32,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    marginVertical: 12,
  },
  translationText: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 24,
  },
});
