import React, { useCallback, useState } from 'react';
import {
    View, Text, FlatList, StyleSheet, TouchableOpacity,
    ActivityIndicator, RefreshControl, SectionList,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { getClientSchedule } from '../../src/api/workout';
import { useTheme } from '../../src/theme';

const toYMD = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const formatScheduledDate = (ymd) => {
    if (!ymd) return null;
    const today = toYMD(new Date());
    const tomorrow = (() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return toYMD(d);
    })();

    if (ymd === today)    return 'Today';
    if (ymd === tomorrow) return 'Tomorrow';

    const d = new Date(ymd + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

const buildSections = (schedule) => {
    const today = toYMD(new Date());
    const in7Days = (() => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        return toYMD(d);
    })();

    const todayItems      = [];
    const upcomingItems   = [];
    const laterItems      = [];
    const unscheduled     = [];

    for (const item of schedule) {
        if (!item.scheduled_date) {
            unscheduled.push(item);
        } else if (item.scheduled_date === today) {
            todayItems.push(item);
        } else if (item.scheduled_date > today && item.scheduled_date <= in7Days) {
            upcomingItems.push(item);
        } else if (item.scheduled_date > today) {
            laterItems.push(item);
        }
        // past items: skip for now (already happened)
    }

    const sections = [];
    if (todayItems.length)    sections.push({ title: "Today's Plan", data: todayItems, isToday: true });
    if (upcomingItems.length) sections.push({ title: 'This Week', data: upcomingItems });
    if (laterItems.length)    sections.push({ title: 'Later', data: laterItems });
    if (unscheduled.length)   sections.push({ title: 'Unscheduled', data: unscheduled });

    return sections;
};

const ClientWorkoutListScreen = () => {
    const navigation = useNavigation();
    const { theme }  = useTheme();
    const [schedule, setSchedule]   = useState([]);
    const [loading, setLoading]     = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError]         = useState(null);

    const fetchSchedule = useCallback(async (cancelled, isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);
            setError(null);
            const data = await getClientSchedule();
            if (!cancelled.value) setSchedule(data.schedule || []);
        } catch (err) {
            if (!cancelled.value) setError('Could not load workouts.');
        } finally {
            if (!cancelled.value) {
                setLoading(false);
                setRefreshing(false);
            }
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            const cancelled = { value: false };
            fetchSchedule(cancelled);
            return () => { cancelled.value = true; };
        }, [fetchSchedule])
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

    const sections = buildSections(schedule);

    const renderItem = ({ item, section }) => {
        const dateLabel = formatScheduledDate(item.scheduled_date);
        const workout   = item.workout || {};
        const isToday   = section.isToday;

        return (
            <TouchableOpacity
                style={[styles.card, isToday && styles.cardToday]}
                onPress={() => navigation.navigate('AssignmentDetail', { assignment: item, role: 'client' })}
                activeOpacity={0.75}
            >
                <View style={styles.cardRow}>
                    <Text style={[styles.cardTitle, isToday && styles.cardTitleToday]}>
                        {workout.title}
                    </Text>
                    {dateLabel ? (
                        <View style={[styles.dateBadge, isToday && styles.dateBadgeToday]}>
                            <Text style={[styles.dateBadgeText, isToday && styles.dateBadgeTextToday]}>
                                {dateLabel}
                            </Text>
                        </View>
                    ) : null}
                </View>
                {workout.difficulty ? (
                    <Text style={styles.cardDetail}>Difficulty: {workout.difficulty}</Text>
                ) : null}
                {workout.duration ? (
                    <Text style={styles.cardDetail}>Duration: {workout.duration} min</Text>
                ) : null}
            </TouchableOpacity>
        );
    };

    const renderSectionHeader = ({ section }) => (
        <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, section.isToday && styles.sectionTitleToday]}>
                {section.title}
            </Text>
        </View>
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Workouts Yet</Text>
            <Text style={styles.emptySubtitle}>
                Your trainer will assign and schedule workouts here.
            </Text>
        </View>
    );

    return (
        <ScreenWrapper title="My Workouts">
            <View style={styles.container}>
                <Text style={styles.screenTitle}>Workout Plan</Text>

                {error ? (
                    <View style={styles.centered}>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity
                            style={styles.retryBtn}
                            onPress={() => fetchSchedule({ value: false })}
                        >
                            <Text style={styles.retryBtnText}>Try Again</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <SectionList
                        sections={sections}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderItem}
                        renderSectionHeader={renderSectionHeader}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={renderEmpty}
                        stickySectionHeadersEnabled={false}
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
                    />
                )}
            </View>
        </ScreenWrapper>
    );
};

const makeStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: theme.background,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.background,
    },
    screenTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 20,
        color: theme.text,
    },
    listContent: {
        paddingBottom: 30,
    },
    sectionHeader: {
        marginTop: 8,
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    sectionTitleToday: {
        color: theme.accent,
    },
    card: {
        backgroundColor: theme.card,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: theme.border,
    },
    cardToday: {
        borderLeftWidth: 4,
        borderLeftColor: theme.accent,
        backgroundColor: theme.accent + '0D',
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.text,
        flex: 1,
        marginRight: 8,
    },
    cardTitleToday: {
        color: theme.text,
    },
    cardDetail: {
        fontSize: 13,
        color: theme.textSecondary,
        marginTop: 2,
    },
    dateBadge: {
        backgroundColor: theme.border,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    dateBadgeToday: {
        backgroundColor: theme.accent,
    },
    dateBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.textSecondary,
    },
    dateBadgeTextToday: {
        color: '#fff',
    },
    errorText: {
        color: theme.error,
        textAlign: 'center',
        marginBottom: 12,
        fontSize: 15,
    },
    retryBtn: {
        backgroundColor: theme.accent,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryBtnText: {
        color: '#fff',
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
        paddingHorizontal: 30,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.text,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: theme.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default ClientWorkoutListScreen;
