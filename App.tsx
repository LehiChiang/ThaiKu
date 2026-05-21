import React, {useEffect} from 'react';
import {StatusBar} from 'expo-status-bar';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {PaperProvider} from 'react-native-paper';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import CourseScreen from './src/screens/CourseScreen';
import LessonListScreen from './src/screens/LessonListScreen';
import LearningScreen from './src/screens/LearningScreen';
import FullTextScreen from './src/screens/FullTextScreen';
import VocabScreen from './src/screens/VocabScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Database
import {initDatabase} from '@/database';

// Theme
import {theme} from '@/constants/theme';

const Stack = createNativeStackNavigator();

export default function App() {
    useEffect(() => {
        initDatabase();
    }, []);

    return (
        <SafeAreaProvider>
            <PaperProvider theme={theme}>
                <NavigationContainer>
                    <StatusBar style="light"/>
                    <Stack.Navigator
                        initialRouteName="Home"
                        screenOptions={{
                            headerStyle: {backgroundColor: '#0066CC'},
                            headerTintColor: '#FFFFFF',
                            headerTitleStyle: {fontWeight: 'bold'},
                        }}
                    >
                        <Stack.Screen
                            name="Home"
                            component={HomeScreen}
                            options={{title: '返回', headerShown: false}}
                        />
                        <Stack.Screen
                            name="Course"
                            component={CourseScreen}
                            options={{headerShown: false}}
                        />
                        <Stack.Screen
                            name="LessonList"
                            component={LessonListScreen}
                            options={{headerShown: false}}
                        />
                        <Stack.Screen
                            name="Learning"
                            component={LearningScreen}
                            options={{headerShown: false}}
                        />
                        <Stack.Screen
                            name="FullText"
                            component={FullTextScreen}
                            options={{headerShown: false}}
                        />
                        <Stack.Screen
                            name="Vocab"
                            component={VocabScreen}
                            options={{title: '生词本'}}
                        />
                        <Stack.Screen
                            name="Settings"
                            component={SettingsScreen}
                            options={{title: '设置'}}
                        />
                    </Stack.Navigator>
                </NavigationContainer>
            </PaperProvider>
        </SafeAreaProvider>
    );
}