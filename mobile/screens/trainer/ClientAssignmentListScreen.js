import React, { useCallback, useState } from 'react';
import {
    View, Text, StyleSheet, SectionList, TouchableOpacity,
    ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { getTrainerClientSchedule } from '../../src/api/assignment';
import { useTheme } from '../../src/theme';

const toYMD = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const formatDate = (ymd) => {
    if (!ymd) return null;
    const today    = toYMD(new Date());
    const tomorrow = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return toYMD(d); })();
    if (ymd === today)    return 'Today';
    if (ymd === tomorrow) return 'Tomorrow';
    const d = new Date(ymd + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

const buildSections = (schedule) => {
    const today  = toYMD(new Date());
    const in7    = (() => { const d = new Date(); d.setDate(d.getDate() + 7); return toYMD(d); })();
    const todayItems = [], upcoming = [], later = [], unscheduled = [], completed = [];

    for (const item of schedule) {
        if (item.completed_at) { completed.push(item); continue; }
        if (!item.scheduled_date) { unscheduled.push(item); continue; }
        if (item.scheduled_date === today)                           todayItems.push(item);
        else if (item.scheduled_date > today && item.scheduled_date <= in7) upcoming.push(item);
        else if (item.scheduled_date > today)                        later.push(item);
        else                                                         completed.push(item);
    }

    const sections = [];
    if (todayItems.length)  sections.push({ title: "Today's Plan",  data: todayItems, isToday: true });
    if (upcoming.length)    sections.push({ title: 'This Week',     data: upcoming });
    if (later.length)       sections.push({ title: 'Later',         data: later });
    if (unscheduled.length) sections.push({ title: 'Unscheduled',   data: unscheduled });
    if (completed.length)   sections.push({ title: 'Completed',     data: completed, isDone: true });
    return sections;
};

const ClientAssignmentListScreen = () => {
    const navigation = useNavigation();
    const route      = useRoute();
    const { client } = route.params;
    const { theme }  = useTheme();

    const [schedule, setSchedule]     = useState([]);
    const [loading, setLoading]       = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError]           = useState(null);

    const fetchSchedule = useCallback(async (cancelled, isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);
            setError(null);
            const data = await getTrainerClientSchedule(client.id);
            if (!cancelled.value) setSchedule(data.schedule || []);
        } catch {
            if (!cancelled.value) setError('Could not load schedule.');
        } finally {
            if (!cancelled.value) { setLoading(false); setRefreshing(false); }
        }
    }, [client.id]);

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
            <ScreenWrapper title={`${client.name}'s Schedule`} showBack>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={theme.accent} />
                </View>
            </ScreenWrapper>
        );
    }

    const sections = buildSections(schedule);

    const renderItem = ({ item, section }) => {
        const workout    = item.workout || {};
        const dateLabel  = formatDate(item.scheduled_date);
        const isToday    = section.isToday;
        const isComplete = !!item.completed_at;

        return (
            <TouchableOpacity
                style={[styles.card, isToday && styles.cardToday, isComplete && styles.cardDone]}
                onPress={() => navigation.navigate('AssignmentDetail', { assignment: item, role: 'trainer' })}
                activeOpacity={0.75}
            >
                <View style={styles.cardRow}>
                    <Text style={styles.cardTitle}>{workout.title}</Text>
                    <View style={styles.badges}>
                        {isComplete && (
                            <View style={styles.doneBadge}>
                                <Text style={styles.doneBadgeText}>Done</Text>
                            </View>
                        )}
                        {dateLabel && !isComplete && (
                            <View style={[styles.dateBadge, isToday && styles.dateBadgeToday]}>
                                <Text style={[styles.dateBadgeText, isToday && styles.dateBadgeTextToday]}>
                                    {dateLabel}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
                {workout.difficulty ? <Text style={styles.cardDetail}>Difficulty: {workout.difficulty}</Text> : null}
                {workout.duration   ? <Text style={styles.cardDetail}>Duration: {workout.duration} min</Text>  : null}
                {(item.like_count > 0 || item.comment_count > 0) && (
                    <View style={styles.statsRow}>
                        {item.like_count > 0    && <Text style={styles.stat}>{item.like_count} like{item.like_count !== 1 ? 's' : ''}</Text>}
                        {item.comment_count > 0 && <Text style={styles.stat}>{item.comment_count} comment{item.comment_count !== 1 ? 's' : ''}</Text>}
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    const renderSectionHeader = ({ section }) => (
        <Text style={[styles.sectionHeader, section.isToday && styles.sectionHeaderToday, section.isDone && styles.sectionHeaderDone]}>
            {section.title}
        </Text>
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Workouts Assigned</Text>
            <Text style={styles.emptySubtitle}>Assign workouts to {client.name} from the Workouts tab.</Text>
        </View>
    );

    return (
        <ScreenWrapper title={`${client.name}'s Schedule`} showBack>
            <View style={styles.container}>
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
                            onRefresh={() => fetchSchedule({ value: false }, true)}
                            tintColor={theme.accent}
                            colors={[theme.accent]}
                        />
                    }
                />
            </View>
        </ScreenWrapper>
    );
};

const makeStyles = (theme) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background, padding: 20 },
    centered:  { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background },
    listContent: { paddingBottom: 30 },
    sectionHeader: {
        fontSize: 12, fontWeight: '700', color: theme.textMuted,
        textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 16, marginBottom: 8,
    },
    sectionHeaderToday: { color: theme.accent },
    sectionHeaderDone:  { color: '#16a34a' },
    card: {
        backgroundColor: theme.card, padding: 16, borderRadius: 12,
        marginBottom: 10, borderWidth: 1, borderColor: theme.border,
    },
    cardToday: { borderLeftWidth: 4, borderLeftColor: theme.accent, backgroundColor: theme.accent + '0D' },
    cardDone:  { borderLeftWidth: 4, borderLeftColor: '#22c55e', backgroundColor: '#22c55e0D' },
    cardRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
    cardTitle: { fontSize: 15, fontWeight: '600', color: theme.text, flex: 1, marginRight: 6 },
    cardDetail:{ fontSize: 13, color: theme.textSecondary, marginTop: 2 },
    badges:    { flexDirection: 'row', gap: 4 },
    dateBadge: { backgroundColor: theme.border, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    dateBadgeToday: { backgroundColor: theme.accent },
    dateBadgeText:  { fontSize: 11, fontWeight: '600', color: theme.textSecondary },
    dateBadgeTextToday: { color: '#fff' },
    doneBadge: { backgroundColor: '#22c55e22', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    doneBadgeText: { fontSize: 11, fontWeight: '700', color: '#16a34a' },
    statsRow:  { flexDirection: 'row', gap: 12, marginTop: 6 },
    stat:      { fontSize: 13, color: theme.textMuted },
    emptyContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: 30 },
    emptyTitle:     { fontSize: 20, fontWeight: '700', color: theme.text, marginBottom: 8 },
    emptySubtitle:  { fontSize: 14, color: theme.textSecondary, textAlign: 'center', lineHeight: 20 },
});

export default ClientAssignmentListScreen;
