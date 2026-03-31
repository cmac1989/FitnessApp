import React, { useCallback, useMemo, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ActivityIndicator, ScrollView, RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import ScreenWrapper from '../../components/ScreenWrapper';
import WorkoutCalendar, { toYMD } from '../../components/WorkoutCalendar';
import { getClientSchedule } from '../../src/api/workout';
import { useTheme } from '../../src/theme';

// ── Helpers ────────────────────────────────────────────────────────────────────

const formatDayHeading = (ymd) => {
    if (!ymd) return '';
    const today    = toYMD(new Date());
    const tomorrow = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return toYMD(d); })();
    if (ymd === today)    return 'Today';
    if (ymd === tomorrow) return 'Tomorrow';
    const d = new Date(ymd + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
};

const buildMarkedDates = (schedule, accent) => {
    const marks = {};
    for (const item of schedule) {
        const ymd = item.scheduled_date;
        if (!ymd) continue;
        const color = item.completed_at ? '#22c55e' : accent;
        if (!marks[ymd]) marks[ymd] = [];
        marks[ymd].push(color);
    }
    return marks;
};

// Pick the best default selected date: today if it has workouts, else next upcoming date
const pickDefaultDate = (schedule) => {
    const today = toYMD(new Date());
    const hasTodayWorkout = schedule.some(item => item.scheduled_date === today);
    if (hasTodayWorkout) return today;

    const upcoming = schedule
        .map(item => item.scheduled_date)
        .filter(d => d && d >= today)
        .sort();
    return upcoming[0] ?? today;
};

// ── Screen ─────────────────────────────────────────────────────────────────────

const ClientWorkoutListScreen = () => {
    const navigation = useNavigation();
    const { theme }  = useTheme();

    const [schedule, setSchedule]     = useState([]);
    const [loading, setLoading]       = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError]           = useState(null);
    const [selectedDate, setSelectedDate] = useState(toYMD(new Date()));

    const fetchSchedule = useCallback(async (cancelled, isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);
            setError(null);
            const data = await getClientSchedule();
            const list = data.schedule || [];
            if (!cancelled.value) {
                setSchedule(list);
                setSelectedDate(pickDefaultDate(list));
            }
        } catch {
            if (!cancelled.value) setError('Could not load workouts.');
        } finally {
            if (!cancelled.value) { setLoading(false); setRefreshing(false); }
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            const cancelled = { value: false };
            fetchSchedule(cancelled);
            return () => { cancelled.value = true; };
        }, [fetchSchedule])
    );

    const markedDates   = useMemo(() => buildMarkedDates(schedule, theme.accent), [schedule, theme.accent]);
    const dayWorkouts   = useMemo(
        () => schedule.filter(item => item.scheduled_date === selectedDate),
        [schedule, selectedDate]
    );
    const unscheduled   = useMemo(
        () => schedule.filter(item => !item.scheduled_date),
        [schedule]
    );

    const styles = makeStyles(theme);

    if (loading) {
        return (
            <ScreenWrapper title="My Workouts">
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={theme.accent} />
                </View>
            </ScreenWrapper>
        );
    }

    const today = toYMD(new Date());

    return (
        <ScreenWrapper title="My Workouts">
            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => {
                            const cancelled = { value: false };
                            fetchSchedule(cancelled, true);
                        }}
                        tintColor={theme.accent}
                        colors={[theme.accent]}
                    />
                }
            >
                {/* ── Header ── */}
                <View style={styles.header}>
                    <Text style={styles.title}>Workout Plan</Text>
                    <View style={styles.legend}>
                        <View style={[styles.legendDot, { backgroundColor: theme.accent }]} />
                        <Text style={styles.legendText}>Scheduled</Text>
                        <View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} />
                        <Text style={styles.legendText}>Done</Text>
                    </View>
                </View>

                {error ? (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity
                            style={styles.retryBtn}
                            onPress={() => fetchSchedule({ value: false })}
                        >
                            <Text style={styles.retryBtnText}>Try Again</Text>
                        </TouchableOpacity>
                    </View>
                ) : schedule.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <View style={[styles.emptyIcon, { backgroundColor: theme.accent + '20' }]}>
                            <Icon name="barbell-outline" size={32} color={theme.accent} />
                        </View>
                        <Text style={styles.emptyTitle}>No Workouts Yet</Text>
                        <Text style={styles.emptySubtitle}>
                            Your trainer will assign and schedule workouts here.
                        </Text>
                    </View>
                ) : (
                    <>
                        {/* ── Calendar ── */}
                        <WorkoutCalendar
                            markedDates={markedDates}
                            selectedDate={selectedDate}
                            onSelectDate={setSelectedDate}
                            theme={theme}
                            style={styles.calendar}
                        />

                        {/* ── Day detail ── */}
                        <View style={styles.daySection}>
                            <Text style={styles.dayHeading}>{formatDayHeading(selectedDate)}</Text>

                            {dayWorkouts.length === 0 ? (
                                <View style={styles.noDayWorkouts}>
                                    <Text style={styles.noDayText}>No workouts scheduled</Text>
                                </View>
                            ) : (
                                dayWorkouts.map(item => (
                                    <WorkoutCard
                                        key={item.id}
                                        item={item}
                                        isToday={selectedDate === today}
                                        onPress={() => navigation.navigate('AssignmentDetail', { assignment: item, role: 'client' })}
                                        theme={theme}
                                        styles={styles}
                                    />
                                ))
                            )}
                        </View>

                        {/* ── Unscheduled ── */}
                        {unscheduled.length > 0 && (
                            <View style={styles.daySection}>
                                <Text style={styles.sectionLabel}>Unscheduled</Text>
                                {unscheduled.map(item => (
                                    <WorkoutCard
                                        key={item.id}
                                        item={item}
                                        isToday={false}
                                        onPress={() => navigation.navigate('AssignmentDetail', { assignment: item, role: 'client' })}
                                        theme={theme}
                                        styles={styles}
                                    />
                                ))}
                            </View>
                        )}
                    </>
                )}
            </ScrollView>
        </ScreenWrapper>
    );
};

// ── Workout card ───────────────────────────────────────────────────────────────

const WorkoutCard = ({ item, isToday, onPress, theme, styles }) => {
    const workout     = item.workout || {};
    const isCompleted = !!item.completed_at;

    return (
        <TouchableOpacity
            style={[
                styles.card,
                isToday     && !isCompleted && styles.cardToday,
                isCompleted && styles.cardDone,
            ]}
            onPress={onPress}
            activeOpacity={0.75}
        >
            <View style={styles.cardRow}>
                <Text style={styles.cardTitle} numberOfLines={1}>{workout.title}</Text>
                {isCompleted && (
                    <View style={styles.doneBadge}>
                        <Icon name="checkmark-circle" size={13} color="#16a34a" />
                        <Text style={styles.doneBadgeText}>Done</Text>
                    </View>
                )}
            </View>

            <View style={styles.cardMeta}>
                {workout.difficulty && (
                    <Text style={styles.cardMetaText}>{workout.difficulty}</Text>
                )}
                {workout.duration && (
                    <Text style={styles.cardMetaText}>{workout.duration} min</Text>
                )}
            </View>

            <Icon name="chevron-forward" size={18} color={theme.textMuted} style={styles.cardChevron} />
        </TouchableOpacity>
    );
};

// ── Styles ─────────────────────────────────────────────────────────────────────

const makeStyles = (theme) => StyleSheet.create({
    scroll: {
        padding: 16,
        paddingBottom: 40,
        backgroundColor: theme.background,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.background,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: theme.text,
    },
    legend: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    legendText: {
        fontSize: 11,
        color: theme.textMuted,
        fontWeight: '500',
        marginRight: 6,
    },

    // Calendar
    calendar: {
        marginBottom: 20,
    },

    // Day section
    daySection: {
        marginBottom: 20,
    },
    dayHeading: {
        fontSize: 17,
        fontWeight: '700',
        color: theme.text,
        marginBottom: 12,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.7,
        marginBottom: 10,
    },
    noDayWorkouts: {
        paddingVertical: 20,
        alignItems: 'center',
        backgroundColor: theme.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.border,
    },
    noDayText: {
        fontSize: 14,
        color: theme.textMuted,
        fontStyle: 'italic',
    },

    // Cards
    card: {
        backgroundColor: theme.card,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.border,
        padding: 14,
        marginBottom: 10,
    },
    cardToday: {
        borderLeftWidth: 3,
        borderLeftColor: theme.accent,
        backgroundColor: theme.accent + '0a',
    },
    cardDone: {
        borderLeftWidth: 3,
        borderLeftColor: '#22c55e',
        backgroundColor: '#22c55e0a',
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.text,
        flex: 1,
        marginRight: 8,
    },
    cardMeta: {
        flexDirection: 'row',
        gap: 12,
    },
    cardMetaText: {
        fontSize: 13,
        color: theme.textSecondary,
    },
    cardChevron: {
        position: 'absolute',
        right: 14,
        top: '50%',
    },
    doneBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#22c55e18',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },
    doneBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#16a34a',
    },

    // Error
    errorBox: {
        alignItems: 'center',
        padding: 24,
    },
    errorText: {
        color: theme.error,
        fontSize: 15,
        marginBottom: 12,
        textAlign: 'center',
    },
    retryBtn: {
        backgroundColor: theme.accent,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10,
    },
    retryBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },

    // Empty
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

export default ClientWorkoutListScreen;
