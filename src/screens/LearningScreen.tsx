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
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Video, AVPlaybackStatus, ResizeMode } from 'expo-av';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList, Lesson, Sentence } from '../types';
import { getLessonData, hasLessonData } from '../utils/lessonData';
import dictionaryData from '../../assets/dictionary.json';
import { addVocabulary } from '../database';

type LearningScreenRouteProp = RouteProp<RootStackParamList, 'Learning'>;
type LearningScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Learning'>;

export default function LearningScreen() {
  const navigation = useNavigation<LearningScreenNavigationProp>();
  const route = useRoute<LearningScreenRouteProp>();
  const { lessonId, courseId, levelId, lesson } = route.params;

  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDictModal, setShowDictModal] = useState(false);
  const [selectedWord, setSelectedWord] = useState<{ word: string; definition: any } | null>(null);
  const [pressedWordIndex, setPressedWordIndex] = useState<number | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const videoRef = useRef<Video>(null);

  React.useEffect(() => {
    loadSentences();
  }, [lessonId]);

  const loadSentences = async () => {
    try {
      let sentencesData: Sentence[] = [];

      // 使用数据加载工具获取课时数据
      if (hasLessonData(lessonId)) {
        const lessonModule = getLessonData(lessonId);
        if (lessonModule && lessonModule.sentences) {
          sentencesData = lessonModule.sentences;
          console.log(`Loaded lesson data for ${lessonId}`);
        }
      } else {
        console.log(`Lesson data not found for ${lessonId}, using fallback`);
        sentencesData = getFallbackSentences(lessonId);
      }

      setSentences(sentencesData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading sentences:', error);
      setSentences(getFallbackSentences(lessonId));
      setLoading(false);
    }
  };

  const getFallbackSentences = (id: string): Sentence[] => {
    const examples: Record<string, Sentence[]> = {
      lesson_01: [
        { id: 's1', startTime: 0, endTime: 3000, text: 'สวัสดีค่ะ', translation: '你好', wordRefs: [{ word: 'สวัสดี', start: 0, end: 5 }, { word: 'ค่ะ', start: 6, end: 9 }] },
        { id: 's2', startTime: 3000, endTime: 6000, text: 'สบายดีไหม', translation: '你好吗', wordRefs: [{ word: 'สบายดี', start: 0, end: 5 }, { word: 'ไหม', start: 6, end: 9 }] },
        { id: 's3', startTime: 6000, endTime: 9000, text: 'ฉันชื่อ...', translation: '我叫...', wordRefs: [{ word: 'ฉัน', start: 0, end: 3 }, { word: 'ชื่อ', start: 4, end: 7 }] },
        { id: 's4', startTime: 9000, endTime: 12000, text: 'ขอบคุณค่ะ', translation: '谢谢', wordRefs: [{ word: 'ขอบคุณ', start: 0, end: 5 }, { word: 'ค่ะ', start: 6, end: 9 }] },
      ],
      lesson_02: [
        { id: 's1', startTime: 0, endTime: 3000, text: 'อยากไปเที่ยวที่ไหนดี', translation: '想去哪里玩呢', wordRefs: [{ word: 'อยาก', start: 0, end: 3 }, { word: 'ไปเที่ยว', start: 4, end: 9 }] },
        { id: 's2', startTime: 3000, endTime: 6000, text: 'สนามบินอยู่ที่ไหน', translation: '机场在哪里', wordRefs: [{ word: 'สนามบิน', start: 0, end: 6 }, { word: 'อยู่ที่ไหน', start: 7, end: 13 }] },
        { id: 's3', startTime: 6000, endTime: 9000, text: 'ขอตั๋วเครื่องบิน', translation: '请给我机票', wordRefs: [{ word: 'ขอ', start: 0, end: 2 }, { word: 'ตั๋วเครื่องบิน', start: 3, end: 13 }] },
      ],
      lesson_03: [
        { id: 's1', startTime: 0, endTime: 3000, text: 'นี่ราคาเท่าไหร่', translation: '这个多少钱', wordRefs: [{ word: 'นี่', start: 0, end: 2 }, { word: 'ราคา', start: 3, end: 7 }] },
        { id: 's2', startTime: 3000, endTime: 6000, text: 'มีของอะไรขายบ้าง', translation: '都卖些什么', wordRefs: [{ word: 'มี', start: 0, end: 2 }, { word: 'ของ', start: 3, end: 6 }] },
        { id: 's3', startTime: 6000, endTime: 9000, text: 'ขอลดราคาได้ไหม', translation: '可以打折吗', wordRefs: [{ word: 'ขอ', start: 0, end: 2 }, { word: 'ลดราคา', start: 3, end: 8 }] },
      ],
      lesson_04: [
        { id: 's1', startTime: 0, endTime: 3000, text: 'สวัสดีครับ', translation: '你好（男）', wordRefs: [{ word: 'สวัสดี', start: 0, end: 5 }, { word: 'ครับ', start: 6, end: 9 }] },
        { id: 's2', startTime: 3000, endTime: 6000, text: 'เจอกันใหม่', translation: '再见', wordRefs: [{ word: 'เจอ', start: 0, end: 3 }, { word: 'กัน', start: 4, end: 7 }] },
        { id: 's3', startTime: 6000, endTime: 9000, text: 'ลาก่อน', translation: '先走了', wordRefs: [{ word: 'ลา', start: 0, end: 3 }, { word: 'ก่อน', start: 4, end: 7 }] },
      ],
      lesson_05: [
        { id: 's1', startTime: 0, endTime: 3000, text: 'ฉันมาจากจีน', translation: '我来自中国', wordRefs: [{ word: 'ฉัน', start: 0, end: 3 }, { word: 'มาจาก', start: 4, end: 9 }] },
        { id: 's2', startTime: 3000, endTime: 6000, text: 'ฉันชอบเรียนภาษาไทย', translation: '我喜欢学泰语', wordRefs: [{ word: 'ฉัน', start: 0, end: 3 }, { word: 'ชอบ', start: 4, end: 7 }] },
        { id: 's3', startTime: 6000, endTime: 9000, text: 'คุณทำอะไรอยู่', translation: '你在做什么', wordRefs: [{ word: 'คุณ', start: 0, end: 3 }, { word: 'ทำ', start: 4, end: 7 }] },
      ],
      lesson_06: [
        { id: 's1', startTime: 0, endTime: 3000, text: 'คุณชื่ออะไร', translation: '你叫什么名字', wordRefs: [{ word: 'คุณ', start: 0, end: 3 }, { word: 'ชื่อ', start: 4, end: 7 }] },
        { id: 's2', startTime: 3000, endTime: 6000, text: 'อายุเท่าไหร่', translation: '多大了', wordRefs: [{ word: 'อายุ', start: 0, end: 3 }, { word: 'เท่าไหร่', start: 4, end: 9 }] },
        { id: 's3', startTime: 6000, endTime: 9000, text: 'อยู่ที่ไหน', translation: '住在哪里', wordRefs: [{ word: 'อยู่', start: 0, end: 3 }, { word: 'ที่ไหน', start: 4, end: 9 }] },
      ],
      lesson_07: [
        { id: 's1', startTime: 0, endTime: 3000, text: 'หนึ่ง สอง สาม', translation: '一二三', wordRefs: [{ word: 'หนึ่ง', start: 0, end: 5 }] },
        { id: 's2', startTime: 3000, endTime: 6000, text: 'สี่ ห้า หก', translation: '四五六', wordRefs: [{ word: 'สี่', start: 0, end: 3 }] },
        { id: 's3', startTime: 6000, endTime: 9000, text: 'เจ็ด แปด เก้า สิบ', translation: '七八九十', wordRefs: [{ word: 'สิบ', start: 8, end: 11 }] },
      ],
      lesson_08: [
        { id: 's1', startTime: 0, endTime: 3000, text: 'สิบหนึ่ง สิบสอง', translation: '十一十二', wordRefs: [{ word: 'สิบหนึ่ง', start: 0, end: 8 }] },
        { id: 's2', startTime: 3000, endTime: 6000, text: 'ยี่สิบ สามสิบ', translation: '二十三十', wordRefs: [{ word: 'ยี่สิบ', start: 0, end: 6 }] },
        { id: 's3', startTime: 6000, endTime: 9000, text: 'ห้าสิบ ร้อย', translation: '五十一百', wordRefs: [{ word: 'ห้าสิบ', start: 0, end: 6 }, { word: 'ร้อย', start: 7, end: 10 }] },
      ],
      lesson_09: [
        { id: 's1', startTime: 0, endTime: 3000, text: 'ตอนนี้กี่โมง', translation: '现在几点', wordRefs: [{ word: 'ตอนนี้', start: 0, end: 6 }, { word: 'กี่โมง', start: 7, end: 13 }] },
        { id: 's2', startTime: 3000, endTime: 6000, text: 'เช้า บ่าย เย็น', translation: '早午晚', wordRefs: [{ word: 'เช้า', start: 0, end: 4 }] },
        { id: 's3', startTime: 6000, endTime: 9000, text: 'วันพรุ่งนี้', translation: '明天', wordRefs: [{ word: 'วัน', start: 0, end: 3 }, { word: 'พรุ่งนี้', start: 4, end: 10 }] },
      ],
      lesson_10: [
        { id: 's1', startTime: 0, endTime: 3000, text: 'ข้าวมันไก่', translation: '米饭鸡肉', wordRefs: [{ word: 'ข้าว', start: 0, end: 4 }, { word: 'มันไก่', start: 5, end: 11 }] },
        { id: 's2', startTime: 3000, endTime: 6000, text: 'ต้มยำกุ้ง', translation: '冬阴功汤', wordRefs: [{ word: 'ต้มยำ', start: 0, end: 6 }, { word: 'กุ้ง', start: 7, end: 11 }] },
        { id: 's3', startTime: 6000, endTime: 9000, text: 'ผัดไทย', translation: '泰式炒河粉', wordRefs: [{ word: 'ผัดไทย', start: 0, end: 7 }] },
      ],
      lesson_11: [
        { id: 's1', startTime: 0, endTime: 3000, text: 'ขอเมนูหน่อย', translation: '请给我菜单', wordRefs: [{ word: 'ขอ', start: 0, end: 2 }, { word: 'เมนู', start: 3, end: 7 }] },
        { id: 's2', startTime: 3000, endTime: 6000, text: 'อยากทานอะไร', translation: '想吃什么', wordRefs: [{ word: 'อยาก', start: 0, end: 3 }, { word: 'ทาน', start: 4, end: 7 }] },
        { id: 's3', startTime: 6000, endTime: 9000, text: 'ขอน้ำเปล่า', translation: '请给我水', wordRefs: [{ word: 'ขอ', start: 0, end: 2 }, { word: 'น้ำเปล่า', start: 3, end: 9 }] },
      ],
      lesson_12: [
        { id: 's1', startTime: 0, endTime: 3000, text: 'ฉันชอบผัดไทย', translation: '我喜欢泰式炒河粉', wordRefs: [{ word: 'ฉัน', start: 0, end: 3 }, { word: 'ชอบ', start: 4, end: 7 }] },
        { id: 's2', startTime: 3000, endTime: 6000, text: 'ไม่เผ็ด', translation: '不辣', wordRefs: [{ word: 'ไม่', start: 0, end: 3 }, { word: 'เผ็ด', start: 4, end: 8 }] },
        { id: 's3', startTime: 6000, endTime: 9000, text: 'เผ็ดน้อย', translation: '微辣', wordRefs: [{ word: 'เผ็ด', start: 0, end: 4 }, { word: 'น้อย', start: 5, end: 8 }] },
      ],
      lesson_13: [
        { id: 's1', startTime: 0, endTime: 3000, text: 'สนามบินสุวรรณภูมิอยู่ไกลไหม', translation: '素万那普机场远吗', wordRefs: [{ word: 'สนามบิน', start: 0, end: 6 }] },
        { id: 's2', startTime: 3000, endTime: 6000, text: 'ขอตั๋วไปภูเก็ต', translation: '要买去普吉岛的票', wordRefs: [{ word: 'ขอ', start: 0, end: 2 }, { word: 'ตั๋ว', start: 3, end: 6 }] },
        { id: 's3', startTime: 6000, endTime: 9000, text: 'เที่ยวบินออกเวลาไหน', translation: '航班几点起飞', wordRefs: [{ word: 'เที่ยวบิน', start: 0, end: 6 }] },
      ],
      lesson_14: [
        { id: 's1', startTime: 0, endTime: 3000, text: 'ฉันมีการจองห้องพัก', translation: '我订了房间', wordRefs: [{ word: 'ฉัน', start: 0, end: 3 }, { word: 'มี', start: 4, end: 6 }] },
        { id: 's2', startTime: 3000, endTime: 6000, text: 'เช็คอินตอนกี่โมง', translation: '几点可以入住', wordRefs: [{ word: 'เช็คอิน', start: 0, end: 6 }] },
        { id: 's3', startTime: 6000, endTime: 9000, text: 'อาหารเช้ามีบริการไหม', translation: '有早餐服务吗', wordRefs: [{ word: 'อาหารเช้า', start: 0, end: 7 }] },
      ],
      lesson_15: [
        { id: 's1', startTime: 0, endTime: 3000, text: 'อยากไปตลาดนัดได้อย่างไร', translation: '怎么去周末市场', wordRefs: [{ word: 'ตลาดนัด', start: 6, end: 11 }] },
        { id: 's2', startTime: 3000, endTime: 6000, text: 'ตรงไปแล้วเลี้ยวซ้าย', translation: '直走后左转', wordRefs: [{ word: 'ตรง', start: 0, end: 3 }, { word: 'เลี้ยวซ้าย', start: 12, end: 17 }] },
        { id: 's3', startTime: 6000, endTime: 9000, text: 'ไกลแค่ไหน', translation: '大概多远', wordRefs: [{ word: 'ไกล', start: 0, end: 3 }, { word: 'แค่ไหน', start: 4, end: 9 }] },
      ],
      lesson_16: [
        { id: 's1', startTime: 0, endTime: 3000, text: 'ฉันสมัครงานตำแหน่งนี้', translation: '我申请这个职位', wordRefs: [{ word: 'สมัครงาน', start: 4, end: 10 }] },
        { id: 's2', startTime: 3000, endTime: 6000, text: 'มีประสบการณ์ทำงาน 3 ปี', translation: '有3年工作经验', wordRefs: [{ word: 'ประสบการณ์', start: 4, end: 11 }] },
        { id: 's3', startTime: 6000, endTime: 9000, text: 'พูดภาษาไทยได้คล่องๆ', translation: '会说一点泰语', wordRefs: [{ word: 'พูด', start: 0, end: 3 }, { word: 'ภาษาไทย', start: 4, end: 10 }] },
      ],
      lesson_17: [
        { id: 's1', startTime: 0, endTime: 3000, text: 'มีประเด็นประชุมอะไร', translation: '会议议题是什么', wordRefs: [{ word: 'ประเด็น', start: 4, end: 9 }] },
        { id: 's2', startTime: 3000, endTime: 6000, text: 'ขอเสนอแนะ', translation: '请让我发表意见', wordRefs: [{ word: 'ขอเสนอ', start: 0, end: 6 }, { word: 'แนะ', start: 7, end: 10 }] },
        { id: 's3', startTime: 6000, endTime: 9000, text: 'เข้าใจแล้ว', translation: '明白了', wordRefs: [{ word: 'เข้าใจ', start: 0, end: 5 }] },
      ],
      lesson_18: [
        { id: 's1', startTime: 0, endTime: 3000, text: 'ฉันเรียนที่มหาวิทยาลัย', translation: '我在大学学习', wordRefs: [{ word: 'เรียน', start: 4, end: 8 }] },
        { id: 's2', startTime: 3000, endTime: 6000, text: 'สอบวันพรุ่งนี้', translation: '明天考试', wordRefs: [{ word: 'สอบ', start: 0, end: 3 }, { word: 'วันพรุ่งนี้', start: 4, end: 12 }] },
        { id: 's3', startTime: 6000, endTime: 9000, text: 'ยังไม่ได้อ่านหนังสือ', translation: '还没读书', wordRefs: [{ word: 'ยังไม่', start: 0, end: 5 }] },
      ],
      lesson_19: [
        { id: 's1', startTime: 0, endTime: 3000, text: 'อยากไปดูหนังกันไหม', translation: '想一起看电影吗', wordRefs: [{ word: 'ไปดูหนัง', start: 4, end: 10 }] },
        { id: 's2', startTime: 3000, endTime: 6000, text: 'เจอกันตรงเวลาไหน', translation: '什么时候见面', wordRefs: [{ word: 'เจอกัน', start: 0, end: 5 }, { word: 'ตรง', start: 6, end: 9 }] },
        { id: 's3', startTime: 6000, endTime: 9000, text: 'รอที่หน้าโรงหนังได้ไหม', translation: '可以在电影院前等吗', wordRefs: [{ word: 'รอ', start: 0, end: 2 }] },
      ],
      lesson_20: [
        { id: 's1', startTime: 0, endTime: 3000, text: 'ชอบฟังเพลงไทย', translation: '喜欢听泰国音乐', wordRefs: [{ word: 'ชอบ', start: 0, end: 3 }, { word: 'ฟังเพลง', start: 4, end: 9 }] },
        { id: 's2', startTime: 3000, endTime: 6000, text: 'ดูละครได้เป็นไหม', translation: '会看泰剧吗', wordRefs: [{ word: 'ดูละคร', start: 0, end: 6 }] },
        { id: 's3', startTime: 6000, endTime: 9000, text: 'เล่นเกมด้วยกัน', translation: '一起玩游戏吧', wordRefs: [{ word: 'เล่นเกม', start: 0, end: 6 }] },
      ],
      lesson_21: [
        { id: 's1', startTime: 0, endTime: 3000, text: 'เฟสบุ๊คไอดีคืออะไร', translation: '你的Facebook ID是什么', wordRefs: [{ word: 'เฟสบุ๊ค', start: 0, end: 6 }] },
        { id: 's2', startTime: 3000, endTime: 6000, text: 'ติดตามไลน์ได้ไหม', translation: '可以加LINE吗', wordRefs: [{ word: 'ไลน์', start: 8, end: 12 }] },
        { id: 's3', startTime: 6000, endTime: 9000, text: 'ส่งรูปให้ดูหน่อย', translation: '发张照片看看', wordRefs: [{ word: 'ส่งรูป', start: 0, end: 5 }] },
      ],
      lesson_22: [
        { id: 's1', startTime: 0, endTime: 3000, text: 'ปวดหัว', translation: '头痛', wordRefs: [{ word: 'ปวด', start: 0, end: 3 }, { word: 'หัว', start: 4, end: 7 }] },
        { id: 's2', startTime: 3000, endTime: 6000, text: 'ปวดท้อง', translation: '胃痛', wordRefs: [{ word: 'ปวด', start: 0, end: 3 }, { word: 'ท้อง', start: 4, end: 7 }] },
        { id: 's3', startTime: 6000, endTime: 9000, text: 'ไอ มีไข้', translation: '咳嗽发烧', wordRefs: [{ word: 'ไอ', start: 0, end: 2 }, { word: 'มีไข้', start: 3, end: 8 }] },
      ],
      lesson_23: [
        { id: 's1', startTime: 0, endTime: 3000, text: 'ไปโรงพยาบาล', translation: '去医院', wordRefs: [{ word: 'โรงพยาบาล', start: 3, end: 13 }] },
        { id: 's2', startTime: 3000, endTime: 6000, text: 'ติดต่อแพทย์ได้ไหม', translation: '可以联系医生吗', wordRefs: [{ word: 'แพทย์', start: 6, end: 9 }] },
        { id: 's3', startTime: 6000, endTime: 9000, text: 'รับประกันสุขภาพไหม', translation: '有医疗保险吗', wordRefs: [{ word: 'ประกัน', start: 4, end: 8 }] },
      ],
      lesson_24: [
        { id: 's1', startTime: 0, endTime: 3000, text: 'ซื้อยาปวดหัว', translation: '买头痛药', wordRefs: [{ word: 'ยา', start: 4, end: 6 }] },
        { id: 's2', startTime: 3000, endTime: 6000, text: 'ยานี้กินกี่เม็ด', translation: '这药吃几片', wordRefs: [{ word: 'ยา', start: 0, end: 2 }, { word: 'กิน', start: 3, end: 5 }] },
        { id: 's3', startTime: 6000, endTime: 9000, text: 'มีอาการแพ้ยาไหม', translation: '对药物过敏吗', wordRefs: [{ word: 'แพ้ยา', start: 4, end: 8 }] },
      ],
      lesson_25: [
        { id: 's1', startTime: 0, endTime: 3000, text: 'เรามาเจรจารองเรื่องการค้า', translation: '我们来谈贸易合作', wordRefs: [{ word: 'เรา', start: 0, end: 3 }] },
        { id: 's2', startTime: 3000, endTime: 6000, text: 'สนใจลงทุนไทยไหม', translation: '有兴趣在泰国投资吗', wordRefs: [{ word: 'ลงทุน', start: 4, end: 8 }] },
        { id: 's3', startTime: 6000, endTime: 9000, text: 'ต้องการเงินลงทุนจำนวนเท่าไหร่', translation: '需要多少投资资金', wordRefs: [{ word: 'เงินลงทุน', start: 7, end: 14 }] },
      ],
      lesson_26: [
        { id: 's1', startTime: 0, endTime: 3000, text: 'ข้อตกลงนี้มีผลต่อ 2 ปี', translation: '本协议有效期为2年', wordRefs: [{ word: 'ข้อตกลง', start: 0, end: 6 }] },
        { id: 's2', startTime: 3000, endTime: 6000, text: 'หากผิดเงื่อนไขจะชดใช้ค่าเสียหาย', translation: '如违反条款将赔偿损失', wordRefs: [{ word: 'ผิดเงื่อนไข', start: 4, end: 12 }] },
        { id: 's3', startTime: 6000, endTime: 9000, text: 'กรุณาอ่านสัญญาทุกข้อ', translation: '请仔细阅读所有条款', wordRefs: [{ word: 'สัญญา', start: 13, end: 17 }] },
      ],
      lesson_27: [
        { id: 's1', startTime: 0, endTime: 3000, text: 'ขอนำเสนอโครงการใหม่', translation: '请允许我介绍新项目', wordRefs: [{ word: 'โครงการ', start: 8, end: 14 }] },
        { id: 's2', startTime: 3000, endTime: 6000, text: 'เป้าหมายคือเพิ่มยอดขาย 20%', translation: '目标是增加销售额20%', wordRefs: [{ word: 'ยอดขาย', start: 12, end: 17 }] },
        { id: 's3', startTime: 6000, endTime: 9000, text: 'มีคำถามหรือไม่', translation: '有什么问题吗', wordRefs: [{ word: 'คำถาม', start: 4, end: 8 }] },
      ],
      lesson_28: [
        { id: 's1', startTime: 0, endTime: 3000, text: 'สงกรานต์เป็นเทศกาลที่สำคัญ', translation: '宋干节是重要节日', wordRefs: [{ word: 'สงกรานต์', start: 0, end: 9 }] },
        { id: 's2', startTime: 3000, endTime: 6000, text: 'มีการลอยกระทงและรดน้ำ', translation: '有放水灯和泼水活动', wordRefs: [{ word: 'ลอยกระทง', start: 4, end: 11 }] },
        { id: 's3', startTime: 6000, endTime: 9000, text: 'เป็นเวลาที่ครอบครัวรวมกัน', translation: '是家人团聚的时候', wordRefs: [{ word: 'ครอบครัว', start: 10, end: 15 }] },
      ],
      lesson_29: [
        { id: 's1', startTime: 0, endTime: 3000, text: 'พุทธศาสนามีอิทธิพลมาก', translation: '佛教在泰国影响深远', wordRefs: [{ word: 'พุทธศาสนา', start: 0, end: 9 }] },
        { id: 's2', startTime: 3000, endTime: 6000, text: 'ชาวไทยนับถือพุทธราช', translation: '泰国人信奉佛教', wordRefs: [{ word: 'นับถือ', start: 4, end: 8 }] },
        { id: 's3', startTime: 6000, endTime: 9000, text: 'มีวัดมากมายทั่วประเทศ', translation: '全国各地有很多寺庙', wordRefs: [{ word: 'วัด', start: 4, end: 6 }] },
      ],
      lesson_30: [
        { id: 's1', startTime: 0, endTime: 3000, text: 'ปัญหาความเหลื่อมล้ำในสังคม', translation: '社会贫富差距问题', wordRefs: [{ word: 'ความเหลื่อมล้ำ', start: 4, end: 13 }] },
        { id: 's2', startTime: 3000, endTime: 6000, text: 'รัฐบาลมีมาตรการช่วยเหลือ', translation: '政府有帮扶措施', wordRefs: [{ word: 'มาตรการ', start: 6, end: 11 }] },
        { id: 's3', startTime: 6000, endTime: 9000, text: 'ควรมีการศึกษาเชิงปฏิบัติ', translation: '需要实践教育', wordRefs: [{ word: 'การศึกษา', start: 6, end: 12 }] },
      ],
      lesson_31: [
        { id: 's1', startTime: 0, endTime: 3000, text: 'วันนี้มีข่าวดีทางเศรษฐกิจ', translation: '今天有经济利好消息', wordRefs: [{ word: 'ข่าว', start: 6, end: 9 }] },
        { id: 's2', startTime: 3000, endTime: 6000, text: 'ตลาดหลักทรัพย์เพิ่มขึ้น 2%', translation: '股市上涨2%', wordRefs: [{ word: 'ตลาด', start: 0, end: 4 }] },
        { id: 's3', startTime: 6000, endTime: 9000, text: 'นักลงทุนต่างชาติสนใจ', translation: '外国投资者有兴趣', wordRefs: [{ word: 'นักลงทุน', start: 0, end: 6 }] },
      ],
      lesson_32: [
        { id: 's1', startTime: 0, endTime: 3000, text: 'รายการทีวีที่ได้รับความนิยม', translation: '受欢迎的电视节目', wordRefs: [{ word: 'รายการทีวี', start: 0, end: 9 }] },
        { id: 's2', startTime: 3000, endTime: 6000, text: 'ละครย้อนยุคเป็นที่สนใจ', translation: '复古电视剧受关注', wordRefs: [{ word: 'ละคร', start: 0, end: 4 }] },
        { id: 's3', startTime: 6000, endTime: 9000, text: 'รายการวาไรตี้มีผู้ชมเยอะ', translation: '综艺节目观众很多', wordRefs: [{ word: 'วาไรตี้', start: 8, end: 14 }] },
      ],
      lesson_33: [
        { id: 's1', startTime: 0, endTime: 3000, text: 'โซเชียลมีเดียเปลี่ยนพฤติกรรม', translation: '社交媒体改变行为', wordRefs: [{ word: 'โซเชียลมีเดีย', start: 0, end: 13 }] },
        { id: 's2', startTime: 3000, endTime: 6000, text: 'ผู้คนใช้เวลากับโทรศัพท์มาก', translation: '人们花很多时间在手机上', wordRefs: [{ word: 'โทรศัพท์', start: 14, end: 21 }] },
        { id: 's3', startTime: 6000, endTime: 9000, text: 'ต้องระวังข้อมูลเท็จ', translation: '需要警惕假新闻', wordRefs: [{ word: 'ข้อมูลเท็จ', start: 8, end: 14 }] },
      ],
      lesson_34: [
        { id: 's1', startTime: 0, endTime: 3000, text: 'รามาเกียนเป็นกวีที่มีชื่อเสียง', translation: '拉玛卡恩是著名诗人', wordRefs: [{ word: 'รามาเกียน', start: 0, end: 9 }] },
        { id: 's2', startTime: 3000, endTime: 6000, text: 'บทประพันธ์ที่เกี่ยวกับความรัก', translation: '关于爱情的诗歌', wordRefs: [{ word: 'บทประพันธ์', start: 0, end: 9 }] },
        { id: 's3', startTime: 6000, endTime: 9000, text: 'อรรถพลของไทยมีความงดงาม', translation: '泰语文字很优美', wordRefs: [{ word: 'อรรถพล', start: 0, end: 6 }] },
      ],
      lesson_35: [
        { id: 's1', startTime: 0, endTime: 3000, text: 'โคลงกลอนแสดงความรู้สึก', translation: '诗节表达情感', wordRefs: [{ word: 'โคลงกลอน', start: 0, end: 7 }] },
        { id: 's2', startTime: 3000, endTime: 6000, text: 'ใช้ภาษาอุปมาอย่างมาก', translation: '使用很多隐喻', wordRefs: [{ word: 'อุปมา', start: 4, end: 7 }] },
        { id: 's3', startTime: 6000, endTime: 9000, text: 'กวีสมัยใหม่มีสไตล์หลากหลาย', translation: '现代诗人风格多样', wordRefs: [{ word: 'กวี', start: 0, end: 3 }] },
      ],
      lesson_36: [
        { id: 's1', startTime: 0, endTime: 3000, text: 'ศิลปะไทยมีเอกลักษณ์เฉพาะ', translation: '泰国艺术有独特特征', wordRefs: [{ word: 'ศิลปะไทย', start: 0, end: 9 }] },
        { id: 's2', startTime: 3000, endTime: 6000, text: 'รูปทรงเครื่องเขินอลงสีสัน', translation: '佛塔造型色彩鲜艳', wordRefs: [{ word: 'เครื่องเขิน', start: 6, end: 12 }] },
        { id: 's3', startTime: 6000, endTime: 9000, text: 'ภาพวาดทะเลมีชีวิตชีวา', translation: '海洋画作生动活泼', wordRefs: [{ word: 'ภาพวาด', start: 0, end: 6 }] },
      ],
    };

    return examples[id] || examples.lesson_01;
  };

  const jumpToSentence = (index: number) => {
    if (index < 0 || index >= sentences.length) return;
    setCurrentSentenceIndex(index);
    setShowTranslation(false);
    const sentence = sentences[index];
    videoRef.current?.setPositionAsync(sentence.startTime / 1000);
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

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
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

        <Video
          ref={videoRef}
          source={{ uri: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4' }}
          style={styles.video}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          isLooping
        />

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
});