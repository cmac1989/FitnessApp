import React, { useState, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ActivityIndicator, ScrollView, RefreshControl, Animated,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import ScreenWrapper from '../../components/ScreenWrapper';
import { getTrainerWorkouts } from '../../src/api/workout';
import { getPrograms } from '../../src/api/program';
import { useTheme } from '../../src/theme';

// ── Difficulty color ───────────────────────────────────────────────────────────

const difficultyColor = (level = '') => {
    const l = level.toLowerCase();
    if (l.includes('easy')     || l.includes('beginner'))    return '#22c55e';
    if (l.includes('moderate') || l.includes('intermediate')) return '#f59e0b';
    if (l.includes('hard')     || l.includes('advanced'))    return '#ef4444';
    return '#6366f1';
};

// ── Screen ─────────────────────────────────────────────────────────────────────

const WorkoutListScreen = () => {
    const navigation = useNavigation();
    const { theme }  = useTheme();

    const [activeTab, setActiveTab]       = useState('workouts'); // 'workouts' | 'programs'
    const [workouts, setWorkouts]         = useState([]);
    const [programs, setPrograms]         = useState([]);
    const [loadingWorkouts, setLoadingWorkouts] = useState(true);
    const [loadingPrograms, setLoadingPrograms] = useState(false);
    const [refreshing, setRefreshing]     = useState(false);
    const [programsLoaded, setProgramsLoaded] = useState(false);

    const fetchWorkouts = useCallback(async (cancelled, isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoadingWorkouts(true);
            const data = await getTrainerWorkouts();
            if (!cancelled.value) setWorkouts(data || []);
        } catch (e) {
            console.error('fetchWorkouts', e);
        } finally {
            if (!cancelled.value) { setLoadingWorkouts(false); setRefreshing(false); }
        }
    }, []);

    const fetchPrograms = useCallback(async (cancelled, isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoadingPrograms(true);
            const data = await getPrograms();
            if (!cancelled.value) {
                setPrograms(data || []);
                setProgramsLoaded(true);
            }
        } catch (e) {
            console.error('fetchPrograms', e);
        } finally {
            if (!cancelled.value) { setLoadingPrograms(false); setRefreshing(false); }
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            const cancelled = { value: false };
            fetchWorkouts(cancelled);
            if (programsLoaded) fetchPrograms(cancelled);
            return () => { cancelled.value = true; };
        }, [fetchWorkouts, fetchPrograms, programsLoaded])
    );

    const handleTabChange = (tab) => {
        if (tab === 'library') {
            navigation.navigate('ExerciseLibrary');
            return;
        }
        setActiveTab(tab);
        if (tab === 'programs' && !programsLoaded) {
            const cancelled = { value: false };
            fetchPrograms(cancelled);
        }
    };

    const handleRefresh = () => {
        const cancelled = { value: false };
        if (activeTab === 'workouts') fetchWorkouts(cancelled, true);
        else fetchPrograms(cancelled, true);
    };

    const styles = makeStyles(theme);
    const isLoading = activeTab === 'workouts' ? loadingWorkouts : loadingPrograms;

    return (
        <ScreenWrapper title="My Library">
            <View style={styles.container}>

                {/* ── Segment control ── */}
                <View style={styles.segmentWrap}>
                    <View style={styles.segment}>
                        <TouchableOpacity
                            style={[styles.segTab, activeTab === 'workouts' && styles.segTabActive]}
                            onPress={() => handleTabChange('workouts')}
                            activeOpacity={0.8}
                        >
                            <Icon
                                name="barbell-outline"
                                size={15}
                                color={activeTab === 'workouts' ? '#fff' : theme.textMuted}
                                style={{ marginRight: 5 }}
                            />
                            <Text style={[styles.segTabText, activeTab === 'workouts' && styles.segTabTextActive]}>
                                Workouts
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.segTab, activeTab === 'programs' && styles.segTabActive]}
                            onPress={() => handleTabChange('programs')}
                            activeOpacity={0.8}
                        >
                            <Icon
                                name="layers-outline"
                                size={15}
                                color={activeTab === 'programs' ? '#fff' : theme.textMuted}
                                style={{ marginRight: 5 }}
                            />
                            <Text style={[styles.segTabText, activeTab === 'programs' && styles.segTabTextActive]}>
                                Programs
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.segTab}
                            onPress={() => handleTabChange('library')}
                            activeOpacity={0.8}
                        >
                            <Icon
                                name="library-outline"
                                size={15}
                                color={theme.textMuted}
                                style={{ marginRight: 5 }}
                            />
                            <Text style={styles.segTabText}>
                                Library
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ── Content ── */}
                {isLoading ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color={theme.accent} />
                    </View>
                ) : (
                    <ScrollView
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={handleRefresh}
                                tintColor={theme.accent}
                                colors={[theme.accent]}
                            />
                        }
                    >
                        {activeTab === 'workouts' ? (
                            <WorkoutsList
                                workouts={workouts}
                                navigation={navigation}
                                theme={theme}
                                styles={styles}
                            />
                        ) : (
                            <ProgramsList
                                programs={programs}
                                navigation={navigation}
                                theme={theme}
                                styles={styles}
                            />
                        )}
                    </ScrollView>
                )}

                {/* ── FAB ── */}
                <TouchableOpacity
                    style={[styles.fab, { backgroundColor: theme.accent }]}
                    onPress={() => {
                        if (activeTab === 'workouts') navigation.navigate('CreateWorkout');
                        else navigation.navigate('CreateEditProgram');
                    }}
                    activeOpacity={0.85}
                >
                    <Icon name="add" size={26} color="#fff" />
                </TouchableOpacity>
            </View>
        </ScreenWrapper>
    );
};

// ── Workouts list ──────────────────────────────────────────────────────────────

const WorkoutsList = ({ workouts, navigation, theme, styles }) => {
    if (workouts.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <View style={[styles.emptyIcon, { backgroundColor: theme.accent + '20' }]}>
                    <Icon name="barbell-outline" size={32} color={theme.accent} />
                </View>
                <Text style={styles.emptyTitle}>No Workouts Yet</Text>
                <Text style={styles.emptySubtitle}>Tap + to create your first workout.</Text>
            </View>
        );
    }

    return (
        <>
            {workouts.map(item => {
                const diffColor = difficultyColor(item.difficulty ?? '');
                return (
                    <TouchableOpacity
                        key={item.id}
                        style={styles.card}
                        onPress={() => navigation.navigate('WorkoutDetails', { workout: item })}
                        activeOpacity={0.75}
                    >
                        <View style={[styles.cardIconWrap, { backgroundColor: theme.accent }]}>
                            <Icon name="barbell-outline" size={18} color="#fff" />
                        </View>
                        <View style={styles.cardBody}>
                            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                            <View style={styles.cardMeta}>
                                {item.difficulty && (
                                    <View style={[styles.metaPill, { backgroundColor: diffColor + '20' }]}>
                                        <Text style={[styles.metaPillText, { color: diffColor }]}>
                                            {item.difficulty}
                                        </Text>
                                    </View>
                                )}
                                {item.duration && (
                                    <View style={[styles.metaPill, { backgroundColor: theme.accent + '15' }]}>
                                        <Icon name="time-outline" size={11} color={theme.accent} />
                                        <Text style={[styles.metaPillText, { color: theme.accent }]}>
                                            {item.duration} min
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                        <Icon name="chevron-forward" size={18} color={theme.textMuted} />
                    </TouchableOpacity>
                );
            })}

            {/* AI banner */}
            <TouchableOpacity
                style={styles.aiBanner}
                onPress={() => navigation.navigate('AIWorkout')}
                activeOpacity={0.8}
            >
                <View style={styles.aiBannerLeft}>
                    <View style={styles.aiIconWrap}>
                        <Icon name="sparkles-outline" size={18} color="#fff" />
                    </View>
                    <View>
                        <Text style={styles.aiBannerTitle}>Generate with AI</Text>
                        <Text style={styles.aiBannerSub}>Let AI build a workout for you</Text>
                    </View>
                </View>
                <Icon name="chevron-forward" size={18} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
        </>
    );
};

// ── Programs list ──────────────────────────────────────────────────────────────

const ProgramsList = ({ programs, navigation, theme, styles }) => {
    if (programs.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <View style={[styles.emptyIcon, { backgroundColor: theme.accent + '20' }]}>
                    <Icon name="layers-outline" size={32} color={theme.accent} />
                </View>
                <Text style={styles.emptyTitle}>No Programs Yet</Text>
                <Text style={styles.emptySubtitle}>
                    Tap + to build a program from your existing workouts.
                </Text>
            </View>
        );
    }

    return (
        <>
            {programs.map(item => {
                const count = item.workouts_count ?? 0;
                return (
                    <TouchableOpacity
                        key={item.id}
                        style={styles.card}
                        onPress={() => navigation.navigate('ProgramDetails', { program: item })}
                        activeOpacity={0.75}
                    >
                        <View style={[styles.cardIconWrap, { backgroundColor: '#6366f1' }]}>
                            <Icon name="layers-outline" size={18} color="#fff" />
                        </View>
                        <View style={styles.cardBody}>
                            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                            <View style={styles.cardMeta}>
                                <View style={[styles.metaPill, { backgroundColor: '#6366f115' }]}>
                                    <Icon name="barbell-outline" size={11} color="#6366f1" />
                                    <Text style={[styles.metaPillText, { color: '#6366f1' }]}>
                                        {count} {count === 1 ? 'workout' : 'workouts'}
                                    </Text>
                                </View>
                                {item.description ? (
                                    <Text style={styles.cardDesc} numberOfLines={1}>
                                        {item.description}
                                    </Text>
                                ) : null}
                            </View>
                        </View>
                        <Icon name="chevron-forward" size={18} color={theme.textMuted} />
                    </TouchableOpacity>
                );
            })}
        </>
    );
};

// ── Styles ─────────────────────────────────────────────────────────────────────

const makeStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Segment
    segmentWrap: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    segment: {
        flexDirection: 'row',
        backgroundColor: theme.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.border,
        padding: 3,
    },
    segTab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 9,
        borderRadius: 10,
    },
    segTabActive: {
        backgroundColor: theme.accent,
    },
    segTabText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.textMuted,
    },
    segTabTextActive: {
        color: '#fff',
    },

    // List
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 100, // space for FAB
    },

    // Cards
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.card,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.border,
        padding: 14,
        marginBottom: 10,
        gap: 12,
    },
    cardIconWrap: {
        width: 42,
        height: 42,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    cardBody: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.text,
        marginBottom: 5,
    },
    cardMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flexWrap: 'wrap',
    },
    metaPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    metaPillText: {
        fontSize: 11,
        fontWeight: '600',
    },
    cardDesc: {
        fontSize: 12,
        color: theme.textMuted,
        flex: 1,
    },

    // AI banner
    aiBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#6366f1',
        borderRadius: 14,
        padding: 14,
        marginTop: 4,
        marginBottom: 10,
    },
    aiBannerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    aiIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    aiBannerTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
    },
    aiBannerSub: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 1,
    },

    // FAB
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 6,
    },

    // Empty state
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 30,
        gap: 12,
    },
    emptyIcon: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.text,
    },
    emptySubtitle: {
        fontSize: 14,
        color: theme.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default WorkoutListScreen;
