import React, {useState, useEffect} from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    TextInput,
    StatusBar,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList, Level, Course, Lesson} from '../types';
import indexData from '../../assets/index.json';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface SearchResult {
    type: 'course' | 'lesson';
    level: Level;
    course: Course;
    lesson?: Lesson;
}

const LEVEL_COLORS: Record<string, { primary: string; secondary: string; gradient: string }> = {
    beginner: {primary: '#4CAF50', secondary: '#81C784', gradient: '#E8F5E9'},
    intermediate: {primary: '#FF9800', secondary: '#FFB74D', gradient: '#FFF3E0'},
    advanced: {primary: '#9C27B0', secondary: '#BA68C8', gradient: '#F3E5F5'},
};

const LEVEL_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
    beginner: 'leaf-outline',
    intermediate: 'flame-outline',
    advanced: 'rocket-outline',
};

export default function HomeScreen() {
    const navigation = useNavigation<HomeScreenNavigationProp>();
    const [levels, setLevels] = useState<Level[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

    useEffect(() => {
        loadContent();
    }, []);

    useEffect(() => {
        performSearch();
    }, [searchText, levels]);

    const loadContent = () => {
        setLevels((indexData as any).levels || []);
        setLoading(false);
    };

    const performSearch = () => {
        if (!searchText.trim()) {
            setSearchResults([]);
            return;
        }

        const query = searchText.toLowerCase().trim();
        const results: SearchResult[] = [];

        levels.forEach(level => {
            level.courses.forEach(course => {
                if (course.title.toLowerCase().includes(query)) {
                    results.push({type: 'course', level, course});
                }

                course.lessons.forEach(lesson => {
                    if (lesson.title.toLowerCase().includes(query) || lesson.scene.toLowerCase().includes(query)) {
                        results.push({type: 'lesson', level, course, lesson});
                    }
                });
            });
        });

        setSearchResults(results);
    };

    const handleSearchResultPress = (result: SearchResult) => {
        if (result.type === 'course') {
            navigation.navigate('Course', {levelId: result.level.id, level: result.level});
        } else if (result.type === 'lesson' && result.lesson) {
            navigation.navigate('Learning', {
                lessonId: result.lesson.id,
                courseId: result.course.id,
                levelId: result.level.id,
                lesson: result.lesson,
                course: result.course,
            });
        }
    };

    const renderLevel = ({item}: { item: Level }) => {
        const colors = LEVEL_COLORS[item.id] || LEVEL_COLORS.beginner;
        const iconName = LEVEL_ICONS[item.id] || LEVEL_ICONS.beginner;

        return (
            <TouchableOpacity
                style={[styles.levelCard, {backgroundColor: colors.gradient}]}
                onPress={() => navigation.navigate('Course', {levelId: item.id, level: item})}
            >
                <View style={styles.levelIconContainer}>
                    <Ionicons name={iconName} size={32} color={colors.primary}/>
                </View>
                <View style={styles.levelContent}>
                    <View style={styles.levelHeader}>
                        <Text style={[styles.levelTitle, {color: colors.primary}]}>{item.title}</Text>
                        <View style={[styles.courseCountBadge, {backgroundColor: colors.primary}]}>
                            <Text style={styles.courseCount}>{item.courses.length} 门课程</Text>
                        </View>
                    </View>
                    <Text style={styles.levelDescription}>{item.description}</Text>
                    <View style={styles.levelProgress}>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, {backgroundColor: colors.primary, width: '0%'}]}/>
                        </View>
                        <Text style={styles.progressText}>0% 完成</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderSearchResult = ({item}: { item: SearchResult }) => {
        const colors = LEVEL_COLORS[item.level.id] || LEVEL_COLORS.beginner;
        const iconName = item.type === 'course' ? 'book-outline' : 'play-circle-outline';

        return (
            <TouchableOpacity
                style={styles.searchResultItem}
                onPress={() => handleSearchResultPress(item)}
            >
                <View style={styles.searchResultLeft}>
                    <View style={[styles.searchResultIcon, {backgroundColor: colors.gradient}]}>
                        <Ionicons name={iconName} size={24} color={colors.primary}/>
                    </View>
                </View>
                <View style={styles.searchResultRight}>
                    <View style={styles.searchResultHeader}>
                        <View style={[styles.searchResultTypeBadge, {backgroundColor: colors.primary}]}>
                            <Text style={styles.searchResultType}>
                                {item.type === 'course' ? '课程' : '课时'}
                            </Text>
                        </View>
                        <View style={[styles.searchResultLevelBadge, {backgroundColor: colors.gradient}]}>
                            <Text style={[styles.searchResultLevel, {color: colors.primary}]}>
                                {item.level.title}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.searchResultTitle}>
                        {item.type === 'course' ? item.course.title : item.lesson?.title}
                    </Text>
                    {item.type === 'lesson' && item.lesson && (
                        <>
                            <Text style={styles.searchResultCourse}>{item.course.title}</Text>
                            <View style={styles.searchResultMeta}>
                                <View style={styles.searchResultMetaItem}>
                                    <Ionicons name="location-outline" size={14} color="#999"/>
                                    <Text style={styles.searchResultScene}>{item.lesson.scene}</Text>
                                </View>
                                <View style={styles.searchResultMetaItem}>
                                    <Ionicons name="time-outline" size={14} color="#999"/>
                                    <Text style={styles.searchResultDuration}>{item.lesson.duration}分钟</Text>
                                </View>
                            </View>
                        </>
                    )}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CCCCCC"/>
            </TouchableOpacity>
        );
    };

    return (
        <>
            <StatusBar barStyle="light-content" backgroundColor="#0066CC"/>
            <View style={styles.container}>
                <View style={styles.header}>
                    {/* 泰式花纹背景装饰 */}
                    <View style={styles.headerDecoration}/>

                    <View style={styles.headerTop}>
                        <View style={styles.headerLeft}>
                            <Text style={styles.headerGreeting}>สวัสดี</Text>
                            <Text style={styles.headerSubtitle}>ThaiKu</Text>
                        </View>
                        <TouchableOpacity style={styles.headerIcon}>
                            <Ionicons name="notifications-outline" size={24} color="#FFFFFF"/>
                        </TouchableOpacity>
                    </View>

                    {/* 底部装饰波浪 */}
                    <View style={styles.headerWave}>
                        <View style={styles.waveLayer}/>
                        <View style={[styles.waveLayer, styles.waveLayer2]}/>
                        <View style={[styles.waveLayer, styles.waveLayer3]}/>
                    </View>
                </View>

                <View style={styles.searchContainer}>
                    <View style={styles.searchBar}>
                        <Ionicons name="search" size={20} color="#999999" style={styles.searchIcon}/>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="搜索课程、课时..."
                            placeholderTextColor="#999999"
                            value={searchText}
                            onChangeText={setSearchText}
                        />
                        {searchText.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearButton}>
                                <Ionicons name="close-circle" size={18} color="#CCCCCC"/>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {searchText.trim() ? (
                    <FlatList
                        data={searchResults}
                        renderItem={renderSearchResult}
                        keyExtractor={(item, index) =>
                            `${item.type}-${item.course.id}-${item.lesson?.id || 'course'}-${index}`
                        }
                        contentContainerStyle={styles.list}
                        ListEmptyComponent={
                            <View style={styles.center}>
                                <Text style={styles.emptyText}>未找到相关课程</Text>
                            </View>
                        }
                    />
                ) : loading ? (
                    <View style={styles.center}>
                        <Text>加载中...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={levels}
                        renderItem={renderLevel}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.list}
                    />
                )}

                <View style={styles.bottomNav}>
                    <TouchableOpacity
                        style={[styles.navItem, styles.navItemActive]}
                    >
                        <Ionicons name="home" size={24} color="#0066CC"/>
                        <Text style={[styles.navText, styles.navTextActive]}>首页</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.navItem}
                        onPress={() => navigation.navigate('Vocab')}
                    >
                        <Ionicons name="book" size={24} color="#999999"/>
                        <Text style={styles.navText}>单词本</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.navItem}
                        onPress={() => navigation.navigate('Settings')}
                    >
                        <Ionicons name="settings-outline" size={24} color="#999999"/>
                        <Text style={styles.navText}>设置</Text>
                    </TouchableOpacity>
                </View>
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
        backgroundColor: '#1E3A8A',
        paddingTop: 50,
        paddingBottom: 0,
        paddingHorizontal: 20,
        position: 'relative',
        overflow: 'hidden',
    },
    headerDecoration: {
        position: 'absolute',
        top: 40,
        right: -50,
        width: 180,
        height: 180,
        borderWidth: 4,
        borderColor: '#FFD700',
        borderRadius: 90,
        opacity: 0.4,
        zIndex: 10,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingBottom: 20,
    },
    headerLeft: {
        flex: 1,
    },
    headerGreeting: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFD700',
        letterSpacing: 2,
        marginBottom: 4,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: {width: 0, height: 2},
        textShadowRadius: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 4,
        letterSpacing: 1,
    },
    headerWave: {
        height: 30,
        position: 'relative',
        overflow: 'hidden',
    },
    waveLayer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 20,
        backgroundColor: '#1E3A8A',
        borderTopLeftRadius: 100,
        borderTopRightRadius: 100,
    },
    waveLayer2: {
        backgroundColor: '#244996',
        height: 25,
    },
    waveLayer3: {
        backgroundColor: '#2A59A4',
        height: 30,
    },
    headerIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchContainer: {
        paddingHorizontal: 20,
        marginTop: -20,
    },
    searchBar: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#333333',
        paddingVertical: 0,
    },
    clearButton: {
        padding: 4,
    },
    list: {
        padding: 20,
        paddingBottom: 100,
    },
    levelCard: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        flexDirection: 'row',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
    },
    levelIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    levelContent: {
        flex: 1,
    },
    levelHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    levelTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    courseCountBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    courseCount: {
        fontSize: 12,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    levelDescription: {
        fontSize: 14,
        color: '#666666',
        marginBottom: 12,
    },
    levelProgress: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    progressBar: {
        flex: 1,
        height: 6,
        backgroundColor: 'rgba(0, 0, 0, 0.06)',
        borderRadius: 3,
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    progressText: {
        fontSize: 12,
        color: '#999999',
        fontWeight: '500',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 60,
    },
    bottomNav: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        paddingVertical: 12,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 8},
        shadowOpacity: 0.12,
        shadowRadius: 20,
        elevation: 8,
    },
    navItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8,
    },
    navItemActive: {
        opacity: 1,
    },
    navText: {
        fontSize: 12,
        color: '#999999',
        marginTop: 4,
        fontWeight: '500',
    },
    navTextActive: {
        color: '#0066CC',
    },
    searchResultItem: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    searchResultLeft: {
        marginRight: 14,
    },
    searchResultIcon: {
        width: 52,
        height: 52,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchResultRight: {
        flex: 1,
    },
    searchResultHeader: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 8,
    },
    searchResultTypeBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    searchResultType: {
        fontSize: 11,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    searchResultLevelBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    searchResultLevel: {
        fontSize: 11,
        fontWeight: '600',
    },
    searchResultTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333333',
        marginBottom: 4,
    },
    searchResultCourse: {
        fontSize: 13,
        color: '#666666',
        marginBottom: 8,
    },
    searchResultMeta: {
        flexDirection: 'row',
        gap: 16,
    },
    searchResultMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    searchResultScene: {
        fontSize: 12,
        color: '#999999',
    },
    searchResultDuration: {
        fontSize: 12,
        color: '#999999',
    },
    emptyText: {
        fontSize: 16,
        color: '#999999',
    },
});