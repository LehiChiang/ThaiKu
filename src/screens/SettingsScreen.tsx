import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Paths } from 'expo-file-system';
import { exportDatabase } from '../database';

export default function SettingsScreen() {
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
  versionText: {
    fontSize: 16,
    color: '#666666',
  },
});