import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  Modal,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../types';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import {Paths} from 'expo-file-system';
import {exportDatabase} from '../database';
import {importCoursePackage, type ImportResult} from '../utils/courseImporter';
import {refreshCourseIndex} from '../utils/courseDataManager';

type SettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

export default function SettingsScreen() {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const [showImportModal, setShowImportModal] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const handleBackup = async () => {
    try {
      const data = await exportDatabase();
      const fileUri = Paths.document + `thaiku_backup_${new Date().toISOString().split('T')[0]}.json`;
      await FileSystem.writeAsStringAsync(fileUri, data);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: '备份 ThaiKu 数据',
        });
      } else {
        Alert.alert('备份成功', `文件已保存到: ${fileUri}`);
      }
    } catch (error) {
      Alert.alert('备份失败', error instanceof Error ? error.message : '未知错误');
    }
  };

  const handleRestore = () => {
    Alert.alert(
      '恢复数据',
      '此操作将覆盖当前学习进度，确定继续吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: () => Alert.alert('提示', '恢复功能开发中，敬请期待'),
        },
      ]
    );
  };

  const handleExportVocab = async () => {
    Alert.alert('导出生词本', '功能开发中，敬请期待');
  };

  const handleImportCourse = async (conflictResolution: 'overwrite' | 'skip' | 'keep' = 'overwrite') => {
    setImporting(true);
    setImportResult(null);

    try {
      const result = await importCoursePackage(conflictResolution);
      setImportResult(result);

      if (result.success) {
        await refreshCourseIndex();
      }
    } catch (error) {
      setImportResult({
        success: false,
        addedCourses: [],
        updatedCourses: [],
        skippedCourses: [],
        errors: [error instanceof Error ? error.message : '导入失败'],
      });
    } finally {
      setImporting(false);
    }
  };

  const handleImportPress = async () => {
    if (importing) return;
    setImportResult(null); // 重置之前的导入结果
    setShowImportModal(true);
  };

  const handleImportWithResolution = async (resolution: 'overwrite' | 'skip' | 'keep') => {
    await handleImportCourse(resolution);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>设置</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>数据管理</Text>

        <TouchableOpacity style={styles.menuItem} onPress={handleBackup}>
          <View style={styles.menuItemLeft}>
            <Text style={styles.menuIcon}>📦</Text>
            <Text style={styles.menuText}>备份数据</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleRestore}>
          <View style={styles.menuItemLeft}>
            <Text style={styles.menuIcon}>📥</Text>
            <Text style={styles.menuText}>恢复数据</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleExportVocab}>
          <View style={styles.menuItemLeft}>
            <Text style={styles.menuIcon}>📋</Text>
            <Text style={styles.menuText}>导出生词本</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, importing && styles.menuItemDisabled]}
          onPress={handleImportPress}
          disabled={importing}
        >
          <View style={styles.menuItemLeft}>
            <Text style={styles.menuIcon}>{importing ? '⏳' : '📥'}</Text>
            <Text style={[styles.menuText, importing && styles.menuTextDisabled]}>
              {importing ? '导入中...' : '导入课程'}
            </Text>
          </View>
          <Text style={[styles.menuArrow, importing && styles.menuArrowDisabled]}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>关于</Text>

        <View style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <Text style={styles.menuIcon}>ℹ️</Text>
            <Text style={styles.menuText}>版本</Text>
          </View>
          <Text style={styles.versionText}>v1.0.0</Text>
        </View>
      </View>

      {/* 导入课程弹窗 */}
      <Modal
        visible={showImportModal}
        transparent
        animationType="fade"
        onRequestClose={() => !importing && setShowImportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => !importing && setShowImportModal(false)}
          />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>导入课程</Text>

            {importing ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0066CC" />
                <Text style={styles.loadingText}>请选择 ZIP 课程包文件...</Text>
              </View>
            ) : importResult ? (
              <View style={styles.importResult}>
                {importResult.success ? (
                  <>
                    <Text style={styles.resultTitle}>导入成功</Text>
                    {importResult.addedCourses.length > 0 && (
                      <Text style={styles.resultText}>
                        新增 {importResult.addedCourses.length} 个课程
                      </Text>
                    )}
                    {importResult.updatedCourses.length > 0 && (
                      <Text style={styles.resultText}>
                        更新 {importResult.updatedCourses.length} 个课程
                      </Text>
                    )}
                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={() => {
                        setShowImportModal(false);
                        navigation.navigate('Home');
                      }}
                    >
                      <Text style={styles.primaryButtonText}>确定</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={styles.errorTitle}>导入失败</Text>
                    {importResult.errors.map((error, i) => (
                      <Text key={i} style={styles.errorText}>{error}</Text>
                    ))}
                    <TouchableOpacity
                      style={styles.secondaryButton}
                      onPress={() => setShowImportModal(false)}
                    >
                      <Text style={styles.secondaryButtonText}>关闭</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            ) : (
              <>
                <Text style={styles.modalText}>
                  选择冲突处理方式，然后选择 ZIP 课程包文件。
                </Text>
                <View style={styles.buttonGroup}>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => handleImportWithResolution('overwrite')}
                  >
                    <Text style={styles.primaryButtonText}>覆盖已有课程</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => handleImportWithResolution('keep')}
                  >
                    <Text style={styles.secondaryButtonText}>合并课程</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => setShowImportModal(false)}
                  >
                    <Text style={styles.secondaryButtonText}>取消</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    padding: 20,
    paddingBottom: 10,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  menuItem: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIcon: {
    fontSize: 20,
  },
  menuText: {
    fontSize: 16,
    color: '#333333',
  },
  menuArrow: {
    fontSize: 24,
    color: '#CCCCCC',
    fontWeight: '300',
  },
  menuItemDisabled: {
    opacity: 0.5,
  },
  menuTextDisabled: {
    color: '#999999',
  },
  menuArrowDisabled: {
    color: '#DDDDDD',
  },
  versionText: {
    fontSize: 16,
    color: '#666666',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 20,
    lineHeight: 20,
  },
  buttonGroup: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#0066CC',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '500',
  },
  importResult: {
    padding: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 4,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF5252',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#FF5252',
    marginBottom: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 12,
  },
});