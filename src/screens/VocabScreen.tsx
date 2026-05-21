import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getVocabularyList, removeVocabulary, updateVocabularyMastery, getDueVocabulary, updateReviewResult } from '../database';
import type { Vocabulary } from '../types';
import dictionaryData from '../../assets/dictionary.json';

export default function VocabScreen() {
  const [vocabList, setVocabList] = useState<Vocabulary[]>([]);
  const [displayedList, setDisplayedList] = useState<Vocabulary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'today' | 'all' | 'recent' | 'mastered'>('today');
  const [showMasteryPicker, setShowMasteryPicker] = useState(false);
  const [showDictModal, setShowDictModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewingWord, setReviewingWord] = useState<{ word: string; lessonId: string } | null>(null);
  const [editingWord, setEditingWord] = useState<{ word: string; lessonId: string; masteryLevel: number } | null>(null);
  const [selectedDictWord, setSelectedDictWord] = useState<{ word: string; definition: any } | null>(null);
  const [dueVocabulary, setDueVocabulary] = useState<Vocabulary[]>([]);

  useEffect(() => {
    loadVocabulary();
  }, []);

  // 监听 activeTab 变化，更新显示列表
  useEffect(() => {
    filterVocabularyList();
  }, [activeTab, vocabList, dueVocabulary]);

  const loadVocabulary = async () => {
    const list = await getVocabularyList();
    setVocabList(list);
    setLoading(false);

    // 加载今日到期复习单词
    const dueList = await getDueVocabulary();
    setDueVocabulary(dueList);
  };

  const filterVocabularyList = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    let filtered: Vocabulary[];
    switch (activeTab) {
      case 'today':
        filtered = dueVocabulary;
        break;
      case 'all':
        filtered = vocabList;
        break;
      case 'recent':
        filtered = vocabList.filter(item => {
          const addedDate = new Date(item.addedAt);
          return addedDate >= oneWeekAgo;
        });
        break;
      case 'mastered':
        filtered = vocabList.filter(item => item.masteryLevel >= 4);
        break;
    }

    setDisplayedList(filtered);
  };

  const handleRemove = async (word: string, lessonId: string) => {
    await removeVocabulary(word, lessonId);
    loadVocabulary();
  };

  const openMasteryPicker = (item: Vocabulary) => {
    setEditingWord({ word: item.word, lessonId: item.lessonId, masteryLevel: item.masteryLevel });
    setShowMasteryPicker(true);
  };

  const openReviewModal = (item: Vocabulary) => {
    setReviewingWord({ word: item.word, lessonId: item.lessonId });
    setShowReviewModal(true);
  };

  const handleReviewKnow = async () => {
    if (reviewingWord) {
      await updateReviewResult(reviewingWord.word, reviewingWord.lessonId, true);
    }
    setShowReviewModal(false);
    setReviewingWord(null);
    loadVocabulary();
  };

  const handleReviewUnknown = () => {
    if (reviewingWord) {
      const word = reviewingWord.word;
      const definition = (dictionaryData as any).words[word];
      if (definition) {
        setSelectedDictWord({ word, definition });
        setShowDictModal(true);
      }
      // 更新为不认识，重置进度
      updateReviewResult(word, reviewingWord.lessonId, false);
    }
    setShowReviewModal(false);
    setReviewingWord(null);
    loadVocabulary();
  };

  const openDictModal = (word: string) => {
    const definition = (dictionaryData as any).words[word];
    if (definition) {
      setSelectedDictWord({ word, definition });
      setShowDictModal(true);
    }
  };

  const saveMasteryLevel = async (level: number) => {
    if (editingWord) {
      await updateVocabularyMastery(editingWord.word, editingWord.lessonId, level);
      await loadVocabulary();
      setShowMasteryPicker(false);
      setEditingWord(null);
    }
  };

  const renderStars = (level: number) => {
    return '★'.repeat(level) + '☆'.repeat(5 - level);
  };

  const formatTimeAgo = (isoString: string) => {
    const now = new Date();
    const then = new Date(isoString);
    const diff = Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return '今天';
    if (diff === 1) return '昨天';
    if (diff < 7) return `${diff}天前`;
    return then.toLocaleDateString();
  };

  const formatReviewTime = (isoString: string) => {
    if (!isoString) return '待安排';
    const now = new Date();
    const then = new Date(isoString);
    const diffMs = then.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs <= 0) return '待复习';
    if (diffMins < 60) return `${diffMins}分钟后`;
    if (diffHours < 24) return `${diffHours}小时后`;
    if (diffDays === 1) return '明天';
    if (diffDays < 7) return `${diffDays}天后`;
    return then.toLocaleDateString();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>加载中...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />
      <View style={styles.container}>
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'today' && styles.tabActive]}
            onPress={() => setActiveTab('today')}
          >
            <Ionicons name="alarm-outline" size={16} color={activeTab === 'today' ? '#1E3A8A' : '#999'} />
            <Text style={[styles.tabText, activeTab === 'today' && styles.tabTextActive]}>
              今日复习
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'all' && styles.tabActive]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
              全部
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'recent' && styles.tabActive]}
            onPress={() => setActiveTab('recent')}
          >
            <Ionicons name="time-outline" size={16} color={activeTab === 'recent' ? '#1E3A8A' : '#999'} />
            <Text style={[styles.tabText, activeTab === 'recent' && styles.tabTextActive]}>
              最近添加
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'mastered' && styles.tabActive]}
            onPress={() => setActiveTab('mastered')}
          >
            <Ionicons name="checkmark-circle" size={16} color={activeTab === 'mastered' ? '#1E3A8A' : '#999'} />
            <Text style={[styles.tabText, activeTab === 'mastered' && styles.tabTextActive]}>
              已掌握
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.contentHeader}>
          <Text style={styles.contentTitle}>
            {activeTab === 'today' ? '今日待复习' : activeTab === 'all' ? '全部单词' : activeTab === 'recent' ? '最近一周添加' : '已掌握单词'}
          </Text>
          <Text style={styles.contentCount}>{displayedList.length}</Text>
        </View>

        {displayedList.length > 0 ? (
          <FlatList
            data={displayedList}
            keyExtractor={item => `${item.word}-${item.lessonId}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.vocabCard}
                onLongPress={() => openMasteryPicker(item)}
                activeOpacity={0.95}
              >
                <View style={styles.vocabLeft}>
                  <TouchableOpacity onPress={() => openReviewModal(item)}>
                    <View style={styles.wordContainer}>
                      <Text style={styles.vocabWord}>{item.word}</Text>
                      <Ionicons name="chevron-forward" size={16} color="#0066CC" />
                    </View>
                  </TouchableOpacity>
                  <View style={styles.vocabMeta}>
                    <View style={styles.vocabMetaItem}>
                      <Ionicons name="time-outline" size={13} color="#888" />
                      <Text style={styles.vocabMetaText}>{formatReviewTime(item.nextReviewAt)}</Text>
                    </View>
                    <View style={styles.vocabMetaDivider} />
                    <View style={styles.vocabMetaItem}>
                      <Ionicons name="layers-outline" size={13} color="#888" />
                      <Text style={styles.vocabMetaText}>{item.reviewStage || 1}/8轮</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.vocabRight}>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemove(item.word, item.lessonId)}
                  >
                    <Ionicons name="close-circle" size={22} color="#DDDDDD" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.starsButton}
                    onPress={() => openMasteryPicker(item)}
                    activeOpacity={0.7}
                  >
                    {Array(5).fill(0).map((_, i) => (
                      <Ionicons
                        key={i}
                        name={i < item.masteryLevel ? 'star' : 'star-outline'}
                        size={14}
                        color={i < item.masteryLevel ? '#FFB84D' : '#DDDDDD'}
                      />
                    ))}
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={48} color="#DDD" />
            <Text style={styles.emptyText}>生词本为空</Text>
            <Text style={styles.emptySubtext}>在学习时点击单词即可添加</Text>
          </View>
        )}
      </View>

      {/* 复习确认弹窗 */}
      <Modal
        visible={showReviewModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View style={styles.centerModalOverlay}>
          <TouchableOpacity
            style={styles.centerModalBackdrop}
            activeOpacity={1}
            onPress={() => setShowReviewModal(false)}
          />
          <View style={styles.reviewModalContent}>
            <Text style={styles.reviewWord}>{reviewingWord?.word}</Text>
            <Text style={styles.reviewQuestion}>认识这个单词吗？</Text>
            <View style={styles.reviewButtons}>
              <TouchableOpacity
                style={styles.reviewButtonUnknown}
                onPress={handleReviewUnknown}
                activeOpacity={0.8}
              >
                <Ionicons name="help-circle-outline" size={20} color="#666" />
                <Text style={styles.reviewButtonUnknownText}>不认识</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.reviewButtonKnow}
                onPress={handleReviewKnow}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                <Text style={styles.reviewButtonKnowText}>认识</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 掌握等级选择器模态框 */}
      <Modal
        visible={showMasteryPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMasteryPicker(false)}
      >
        <View style={styles.centerModalOverlay}>
          <TouchableOpacity
            style={styles.centerModalBackdrop}
            activeOpacity={1}
            onPress={() => setShowMasteryPicker(false)}
          />
          <View style={styles.modalContentContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>设置掌握等级</Text>
              <Text style={styles.modalSubtitle}>点击星星选择{editingWord?.word}的掌握程度</Text>

              <View style={styles.masteryPicker}>
                {Array(5).fill(0).map((_, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.masteryOption}
                    onPress={() => saveMasteryLevel(index + 1)}
                  >
                    <Text style={styles.masteryIcon}>
                      {index + 1 <= (editingWord?.masteryLevel || 0) ? '★' : '☆'}
                    </Text>
                    <Text
                      style={[
                        styles.masteryLabel,
                        index + 1 <= (editingWord?.masteryLevel || 0) && styles.masteryLabelSelected
                      ]}
                    >
                      {index + 1} {index === 0 && '星'}
                      {index === 1 && '入门'}
                      {index === 2 && '熟悉'}
                      {index === 3 && '精通'}
                      {index === 4 && '掌握'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowMasteryPicker(false)}
              >
                <Text style={styles.modalCancelText}>取消</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 词典弹窗 */}
      <Modal
        visible={showDictModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDictModal(false)}
      >
        <View style={styles.bottomSheetOverlay}>
          <TouchableOpacity
            activeOpacity={1}
            style={styles.bottomSheetBackdrop}
            onPress={() => setShowDictModal(false)}
          >
            <View style={styles.bottomSheetContainer}>
              <View style={styles.bottomSheetHandle} />
              <TouchableOpacity
                style={styles.bottomSheetCloseButton}
                onPress={() => setShowDictModal(false)}
              >
                <Ionicons name="close" size={24} color="#666666" />
              </TouchableOpacity>

              {selectedDictWord && (
                <View style={styles.bottomSheetContent}>
                  <View style={styles.modalWordSection}>
                    <Text style={styles.modalWord}>{selectedDictWord.word}</Text>
                    {selectedDictWord.definition.pronunciation && (
                      <Text style={styles.modalPronunciation}>
                        {selectedDictWord.definition.pronunciation}
                      </Text>
                    )}
                  </View>

                  <Text style={styles.modalMeaning}>{selectedDictWord.definition.meaning}</Text>

                  {selectedDictWord.definition.partOfSpeech && (
                    <View style={styles.modalTag}>
                      <Text style={styles.modalTagText}>{selectedDictWord.definition.partOfSpeech}</Text>
                    </View>
                  )}

                  {selectedDictWord.definition.usage && (
                    <View style={styles.modalSection}>
                      <View style={styles.modalSectionHeader}>
                        <Ionicons name="information-circle-outline" size={16} color="#0066CC" />
                        <Text style={styles.modalSectionTitle}>用法</Text>
                      </View>
                      <Text style={styles.modalUsage}>{selectedDictWord.definition.usage}</Text>
                    </View>
                  )}

                  {selectedDictWord.definition.examples && selectedDictWord.definition.examples.length > 0 && (
                    <View style={styles.modalSection}>
                      <View style={styles.modalSectionHeader}>
                        <Ionicons name="list-outline" size={16} color="#0066CC" />
                        <Text style={styles.modalSectionTitle}>例句</Text>
                      </View>
                      {selectedDictWord.definition.examples.map((example: any, idx: number) => (
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
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
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
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
    padding: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: '#E8F5E9',
  },
  tabText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#1E3A8A',
    fontWeight: '600',
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  contentTitle: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  contentCount: {
    fontSize: 14,
    color: '#999',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  vocabCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  vocabLeft: {
    flex: 1,
    marginRight: 12,
  },
  wordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  vocabWord: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E3A8A',
  },
  vocabMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vocabMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  vocabMetaDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#EEEEEE',
    marginHorizontal: 12,
  },
  vocabMetaText: {
    fontSize: 12,
    color: '#888',
  },
  vocabRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  removeButton: {
    padding: 4,
  },
  starsButton: {
    flexDirection: 'row',
    gap: 2,
    padding: 8,
    backgroundColor: '#FFF8E6',
    borderRadius: 10,
  },
  vocabStars: {
    flexDirection: 'row',
    gap: 2,
  },
  starIcon: {
    fontSize: 18,
  },
  starFilled: {
    color: '#FFB84D',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginBottom: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#CCC',
  },
  centerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  reviewModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    width: '80%',
    maxWidth: 320,
    alignItems: 'center',
  },
  reviewWord: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 12,
  },
  reviewQuestion: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  reviewButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  reviewButtonUnknown: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F5F5F5',
    paddingVertical: 14,
    borderRadius: 14,
  },
  reviewButtonUnknownText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  reviewButtonKnow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1E3A8A',
    paddingVertical: 14,
    borderRadius: 14,
  },
  reviewButtonKnowText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '500',
  },
  bottomSheetOverlay: {
    flex: 1,
  },
  bottomSheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContentContainer: {
    width: '90%',
    maxWidth: 360,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
  },
  bottomSheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
    maxHeight: '85%',
    width: '100%',
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#DDDDDD',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  bottomSheetCloseButton: {
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
  bottomSheetContent: {
    padding: 16,
    paddingTop: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
  },
  masteryPicker: {
    gap: 16,
  },
  masteryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 12,
    paddingVertical: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  masteryIcon: {
    fontSize: 24,
    width: 40,
    height: 40,
  },
  masteryLabel: {
    flex: 1,
    fontSize: 16,
    color: '#666',
    marginLeft: 12,
  },
  masteryLabelSelected: {
    color: '#1E3A8A',
    fontWeight: '600',
  },
  modalCancelButton: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
  },
  modalCancelText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
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
});
