import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Animated,
  StatusBar,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Video, AVPlaybackStatus, ResizeMode, Audio } from 'expo-av';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList, Lesson, Sentence, Course } from '../types';
import { getLessonData } from '../utils/lessonData';
import dictionaryData from '../../assets/dictionary.json';
import { addVocabulary } from '../database';

type LearningScreenRouteProp = RouteProp<RootStackParamList, 'Learning'>;
type LearningScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Learning'>;

export default function LearningScreen() {
  const navigation = useNavigation<LearningScreenNavigationProp>();
  const route = useRoute<LearningScreenRouteProp>();
  const { lessonId, courseId, levelId, lesson, course } = route.params;

  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [showDictModal, setShowDictModal] = useState(false);
  const [selectedWord, setSelectedWord] = useState<{ word: string; definition: any } | null>(null);
  const [pressedWordIndex, setPressedWordIndex] = useState<number | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // 音频播放器状态
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioPosition, setAudioPosition] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  const videoRef = useRef<Video>(null);
  const audioRef = useRef<Audio.Sound | null>(null);

  React.useEffect(() => {
    loadSentences();
  }, [lessonId]);

  const loadSentences = async () => {
    try {
      const lessonModule = getLessonData(lessonId);
      if (lessonModule && lessonModule.sentences) {
        setSentences(lessonModule.sentences);
        setLoading(false);
      } else {
        console.error(`Lesson data not found: ${lessonId}`);
        setLoadError(true);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading sentences:', error);
      setLoadError(true);
      setLoading(false);
    }
  };

  const jumpToSentence = (index: number) => {
    if (index < 0 || index >= sentences.length) return;
    setCurrentSentenceIndex(index);
    setShowTranslation(false);
    const sentence = sentences[index];

    if (course.type === 'video') {
      videoRef.current?.setPositionAsync(sentence.startTime / 1000);
    } else if (course.type === 'audio' && audioRef.current) {
      audioRef.current.setPositionAsync(sentence.startTime / 1000);
    }
  };

  const handleWordPress = (word: string, index: number) => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setPressedWordIndex(index);
    setTimeout(() => setPressedWordIndex(null), 200);

    const definition = (dictionaryData as any).words[word];
    if (definition) {
      setSelectedWord({ word, definition });
      setShowDictModal(true);
    }
  };

  const currentSentence = sentences[currentSentenceIndex];

  const formatTime = (millis: number) => {
    if (!millis || !isFinite(millis)) return '0:00';
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const loadAudio = async () => {
    if (course.type !== 'audio') return;

    const { sound } = await Audio.Sound.createAsync(
      { uri: lesson.audioUrl || 'https://sample-videos.com/audio/mp3/crowd-cheering.mp3' },
      { shouldPlay: false },
      onAudioStatusUpdate
    );
    audioRef.current = sound;

    sound.setOnPlaybackStatusUpdate(onAudioStatusUpdate);
  };

  const onAudioStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setAudioPosition(status.positionMillis);
      setAudioDuration(status.durationMillis);
      setIsPlaying(status.isPlaying);
    }
  };

  const toggleAudioPlayback = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      await audioRef.current.pauseAsync();
    } else {
      await audioRef.current.playAsync();
    }
  };

  const seekAudio = async (position: number) => {
    if (!audioRef.current) return;
    await audioRef.current.setPositionAsync(position);
  };

  React.useEffect(() => {
    if (course.type === 'audio' && !loading) {
      loadAudio();
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.unloadAsync();
      }
    };
  }, [course.type, loading]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }

  if (loadError) {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor="#0066CC" />
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>加载失败</Text>
            </View>
            <View style={styles.headerIcon} />
          </View>
          <View style={styles.centerContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#FF6B6B" />
            <Text style={styles.errorTitle}>课程数据不存在</Text>
            <Text style={styles.errorSubTitle}>课时 ID: {lessonId}</Text>
            <Text style={styles.errorDesc}>请联系管理员或稍后再试</Text>
            <TouchableOpacity
              style={styles.backButtonLarge}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
              <Text style={styles.backButtonText}>返回</Text>
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0066CC" />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{lesson.title}</Text>
            <Text style={styles.headerSubtitle}>
              {currentSentenceIndex + 1} / {sentences.length}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={() => navigation.navigate('FullText', { sentences })}
          >
            <Ionicons name="book-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* 根据课程类型渲染不同内容 */}
        {course.type === 'video' && (
          <Video
            ref={videoRef}
            source={{ uri: lesson.videoUrl || 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4' }}
            style={styles.video}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            isLooping
          />
        )}

        {course.type === 'audio' && (
          <View style={styles.audioContainer}>
            <Image
              source={{ uri: lesson.audioCover || course.thumbnail || 'https://via.placeholder.com/300x300/0066CC/FFFFFF?text=Audio' }}
              style={styles.audioCover}
              resizeMode="cover"
            />
            <View style={styles.audioControls}>
              <TouchableOpacity
                style={styles.playButton}
                onPress={toggleAudioPlayback}
              >
                <Ionicons name={isPlaying ? 'pause' : 'play'} size={32} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.progressContainer}>
                <Text style={styles.timeText}>{formatTime(audioPosition)}</Text>
                <View style={styles.progressBar}>
                  <View style={[
                    styles.progressFill,
                    { width: `${(audioPosition / audioDuration) * 100}%` }
                  ]} />
                </View>
                <Text style={styles.timeText}>{formatTime(audioDuration)}</Text>
              </View>
            </View>
          </View>
        )}

        {course.type === 'document' && (
          <View style={styles.documentContainer}>
            <Ionicons name="document-text-outline" size={48} color="#0066CC" />
            <Text style={styles.documentTitle}>文档内容</Text>
            <Text style={styles.documentDesc}>请点击下方查看完整内容</Text>
          </View>
        )}

        <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
          {currentSentence && (
            <Animated.View style={[styles.sentenceCard, { transform: [{ scale: scaleAnim }] }]}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setShowTranslation(!showTranslation)}
                style={styles.sentenceTouchable}
              >
                <View style={styles.sentenceHeader}>
                  <Ionicons name="chatbubble-outline" size={20} color="#0066CC" />
                  <Text style={styles.sentenceLabel}>当前句子</Text>
                </View>
                <Text style={styles.thaiText}>{currentSentence.text}</Text>
                {showTranslation && (
                  <Animated.View style={styles.translationContainer}>
                    <View style={styles.translationDivider} />
                    <Text style={styles.translationText}>{currentSentence.translation}</Text>
                  </Animated.View>
                )}
              </TouchableOpacity>

              <View style={styles.wordSection}>
                <View style={styles.wordSectionHeader}>
                  <Ionicons name="book-outline" size={18} color="#666" />
                  <Text style={styles.wordSectionLabel}>点击词语查看释义</Text>
                </View>
                <View style={styles.wordContainer}>
                  {currentSentence.wordRefs.map((ref: { word: string; start: number; end: number }, idx: number) => (
                    <Animated.View key={idx}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        style={[
                          styles.wordButton,
                          pressedWordIndex === idx && styles.wordButtonPressed,
                        ]}
                        onPress={() => handleWordPress(ref.word, idx)}
                      >
                        <Text style={styles.wordText}>{ref.word}</Text>
                      </TouchableOpacity>
                    </Animated.View>
                  ))}
                </View>
              </View>
            </Animated.View>
          )}

          <View style={styles.sentenceListSection}>
            <Text style={styles.sentenceListTitle}>全部句子</Text>
            <View style={styles.sentenceList}>
              {sentences.map((sentence, index) => (
                <TouchableOpacity
                  key={sentence.id}
                  activeOpacity={0.7}
                  style={[
                    styles.sentenceItem,
                    index === currentSentenceIndex && styles.activeSentence,
                  ]}
                  onPress={() => jumpToSentence(index)}
                >
                  <View style={styles.sentenceItemLeft}>
                    <View style={[
                      styles.sentenceNumber,
                      index === currentSentenceIndex && styles.activeSentenceNumber
                    ]}>
                      <Text style={[
                        styles.sentenceNumberText,
                        index === currentSentenceIndex && styles.activeSentenceNumberText
                      ]}>
                        {index + 1}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.sentenceItemText,
                        index === currentSentenceIndex && styles.activeSentenceText,
                      ]}
                    >
                      {sentence.text}
                    </Text>
                  </View>
                  {index === currentSentenceIndex && (
                    <Ionicons name="play-circle" size={20} color="#0066CC" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.floatingControls}>
          <TouchableOpacity
            style={[
              styles.floatingButton,
              currentSentenceIndex === 0 && styles.floatingButtonDisabled,
            ]}
            activeOpacity={0.7}
            onPress={() => jumpToSentence(currentSentenceIndex - 1)}
            disabled={currentSentenceIndex === 0}
          >
            <Ionicons
              name="play-skip-back"
              size={28}
              color={currentSentenceIndex === 0 ? '#CCCCCC' : '#FFFFFF'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.floatingButton,
              currentSentenceIndex === sentences.length - 1 && styles.floatingButtonDisabled,
            ]}
            activeOpacity={0.7}
            onPress={() => jumpToSentence(currentSentenceIndex + 1)}
            disabled={currentSentenceIndex === sentences.length - 1}
          >
            <Ionicons
              name="play-skip-forward"
              size={28}
              color={currentSentenceIndex === sentences.length - 1 ? '#CCCCCC' : '#FFFFFF'}
            />
          </TouchableOpacity>
        </View>

        <Modal
          visible={showDictModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDictModal(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              activeOpacity={1}
              style={styles.modalBackdrop}
              onPress={() => setShowDictModal(false)}
            >
              <View style={styles.modalContent}>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowDictModal(false)}
                >
                  <Ionicons name="close" size={24} color="#666666" />
                </TouchableOpacity>

                {selectedWord && (
                  <>
                    <View style={styles.modalWordSection}>
                      <Text style={styles.modalWord}>{selectedWord.word}</Text>
                      {selectedWord.definition.pronunciation && (
                        <Text style={styles.modalPronunciation}>
                          {selectedWord.definition.pronunciation}
                        </Text>
                      )}
                    </View>

                    <Text style={styles.modalMeaning}>{selectedWord.definition.meaning}</Text>

                    {selectedWord.definition.partOfSpeech && (
                      <View style={styles.modalTag}>
                        <Text style={styles.modalTagText}>{selectedWord.definition.partOfSpeech}</Text>
                      </View>
                    )}

                    {selectedWord.definition.usage && (
                      <View style={styles.modalSection}>
                        <View style={styles.modalSectionHeader}>
                          <Ionicons name="information-circle-outline" size={16} color="#0066CC" />
                          <Text style={styles.modalSectionTitle}>用法</Text>
                        </View>
                        <Text style={styles.modalUsage}>{selectedWord.definition.usage}</Text>
                      </View>
                    )}

                    {selectedWord.definition.examples && selectedWord.definition.examples.length > 0 && (
                      <View style={styles.modalSection}>
                        <View style={styles.modalSectionHeader}>
                          <Ionicons name="list-outline" size={16} color="#0066CC" />
                          <Text style={styles.modalSectionTitle}>例句</Text>
                        </View>
                        {selectedWord.definition.examples.map((example: any, idx: number) => (
                          <View key={idx} style={styles.exampleItem}>
                            <View style={styles.exampleBullet} />
                            <View style={styles.exampleContent}>
                              <Text style={styles.exampleThai}>{example.sentence}</Text>
                              <Text style={styles.exampleTranslation}>{example.translation}</Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}

                    <TouchableOpacity
                      style={styles.modalAddButton}
                      activeOpacity={0.8}
                      onPress={async () => {
                        if (selectedWord) {
                          await addVocabulary(selectedWord.word, lessonId);
                          setShowDictModal(false);
                        }
                      }}
                    >
                      <Ionicons name="bookmark-outline" size={20} color="#FFFFFF" />
                      <Text style={styles.modalAddButtonText}>添加到生词本</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 18,
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
  video: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  audioContainer: {
    backgroundColor: '#000',
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  audioCover: {
    width: 200,
    height: 200,
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  audioControls: {
    width: '100%',
    alignItems: 'center',
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#0066CC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#0066CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0066CC',
  },
  timeText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  documentContainer: {
    backgroundColor: '#F8F9FA',
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  documentDesc: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  sentenceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  sentenceTouchable: {
    width: '100%',
  },
  sentenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sentenceLabel: {
    fontSize: 14,
    color: '#999999',
    fontWeight: '500',
  },
  thaiText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0066CC',
    marginBottom: 16,
    lineHeight: 36,
  },
  translationContainer: {
    marginTop: 12,
  },
  translationDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    marginBottom: 12,
  },
  translationText: {
    fontSize: 18,
    color: '#666666',
    lineHeight: 26,
  },
  wordSection: {
    marginTop: 20,
  },
  wordSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  wordSectionLabel: {
    fontSize: 13,
    color: '#999999',
  },
  wordContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  wordButton: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  wordButtonPressed: {
    backgroundColor: '#BBDEFB',
    borderColor: '#0066CC',
  },
  wordText: {
    fontSize: 16,
    color: '#0066CC',
    fontWeight: '500',
  },
  sentenceListSection: {
    marginBottom: 100,
  },
  sentenceListTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  sentenceList: {
    gap: 8,
  },
  sentenceItem: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  sentenceItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  sentenceNumber: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sentenceNumberText: {
    fontSize: 14,
    color: '#999999',
    fontWeight: '600',
  },
  sentenceItemText: {
    fontSize: 15,
    color: '#333333',
    flex: 1,
  },
  activeSentence: {
    backgroundColor: '#E3F2FD',
    borderColor: '#0066CC',
  },
  activeSentenceNumber: {
    backgroundColor: '#0066CC',
  },
  activeSentenceNumberText: {
    color: '#FFFFFF',
  },
  activeSentenceText: {
    color: '#0066CC',
    fontWeight: '600',
  },
  floatingControls: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
  },
  floatingButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0066CC',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0066CC',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  floatingButtonDisabled: {
    backgroundColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOpacity: 0.1,
  },
  modalOverlay: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    maxHeight: '80%',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalWordSection: {
    marginTop: 20,
    marginBottom: 12,
  },
  modalWord: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#0066CC',
  },
  modalPronunciation: {
    fontSize: 18,
    color: '#666666',
    marginTop: 8,
  },
  modalMeaning: {
    fontSize: 22,
    color: '#333333',
    marginBottom: 16,
    lineHeight: 30,
  },
  modalTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 20,
  },
  modalTagText: {
    fontSize: 13,
    color: '#0066CC',
    fontWeight: '600',
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666666',
  },
  modalUsage: {
    fontSize: 15,
    color: '#333333',
    lineHeight: 22,
  },
  exampleItem: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  exampleBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0066CC',
    marginTop: 8,
    marginRight: 12,
  },
  exampleContent: {
    flex: 1,
  },
  exampleThai: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 4,
  },
  exampleTranslation: {
    fontSize: 14,
    color: '#999999',
  },
  modalAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0066CC',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  modalAddButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 24,
  },
  errorSubTitle: {
    fontSize: 14,
    color: '#999999',
    marginTop: 8,
  },
  errorDesc: {
    fontSize: 16,
    color: '#666666',
    marginTop: 4,
  },
  backButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0066CC',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 32,
    shadowColor: '#0066CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});