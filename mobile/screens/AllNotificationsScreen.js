import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, SectionList, ActivityIndicator,
    TouchableOpacity, RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import ScreenWrapper from '../components/ScreenWrapper';
import { getUserNotifications, markNotificationsAsRead } from '../src/api/notification';
import { getClientNotifications, markClientNotificationsAsRead } from '../src/api/client';
import { useTheme } from '../src/theme';

// ── Shared helpers ─────────────────────────────────────────────────────────────

const AVATAR_COLORS = ['#6366f1', '#f43f5e', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

const hashColor = (str = '') => {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
    return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
};

const getInitials = (name = '') => {
    const parts = name.trim().split(' ');
    return parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : name.substring(0, 2).toUpperCase();
};

// ── Trainer avatar logic ───────────────────────────────────────────────────────
// Trainer notifications originate from a client.
// Initials = client name; colour = hash of client name (unique per client).
// For older notifications without an explicit client_name field, we extract
// the sender's name from the message string — it always starts with the client's
// full name followed by a verb or colon (e.g. "Sarah Anderson submitted...").

const extractNameFromMessage = (msg = '') => {
    if (!msg) return null;
    const match = msg.match(/^(.+?)(?:\s+(?:submitted|completed|accepted|declined|liked|assigned)|:\s)/);
    return match?.[1]?.trim() ?? null;
};

const getClientSenderName = (item) => {
    const d = item.data || {};
    if (d.client_name) return d.client_name;
    const fromMsg = extractNameFromMessage(d.message ?? '');
    if (fromMsg) return fromMsg;
    return '?';
};

const trainerAvatar = (item) => {
    const name = getClientSenderName(item);
    return { bg: hashColor(name), initials: getInitials(name) };
};

// ── Client avatar logic ────────────────────────────────────────────────────────
// Client notifications originate from a trainer.
// Initials = trainer name; colour = fixed per notification category.

const TYPE_COLORS = {
    check_in_assigned:   '#10b981', // emerald — health / progress
    check_in_reviewed:   '#10b981',
    check_in_submitted:  '#10b981',
    workout_assigned:    '#f59e0b', // amber — energy / activity
    workout_liked:       '#f59e0b',
    workout_commented:   '#f59e0b',
    workout_completed:   '#f59e0b',
    comment_liked:       '#f59e0b',
    trainer_invite:      '#8b5cf6', // violet — relationship / onboarding
    invitation_sent:     '#8b5cf6',
    invitation_accepted: '#8b5cf6',
    invitation_declined: '#8b5cf6',
    message_liked:       '#3b82f6', // blue — communication
};
const DEFAULT_TYPE_COLOR = '#6366f1';

const getTypeColor = (type) => TYPE_COLORS[type] ?? DEFAULT_TYPE_COLOR;

const getTrainerSenderName = (item) => {
    const d = item.data || {};
    if (d.trainer_name) return d.trainer_name;
    const t = item.type ?? '';
    if (t.startsWith('check_in')) return 'Check In';
    if (t.startsWith('workout'))  return 'Workout';
    if (t.includes('message'))    return 'Message';
    if (t.includes('invite') || t.includes('invitation')) return 'Invite';
    return 'App';
};

const clientAvatar = (item) => ({
    bg:       getTypeColor(item.type),
    initials: getInitials(getTrainerSenderName(item)),
});

// ── Role-aware avatar resolver ─────────────────────────────────────────────────

const resolveAvatar = (item, role) =>
    role === 'client' ? clientAvatar(item) : trainerAvatar(item);

// ── Timestamp ──────────────────────────────────────────────────────────────────

const timeAgo = (dateString) => {
    if (!dateString) return '';
    const diff = Date.now() - new Date(dateString).getTime();
    const mins  = Math.floor(diff / 60000);
    if (mins < 1)  return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return 'yesterday';
    if (days < 7)  return new Date(dateString).toLocaleDateString('en-US', { weekday: 'short' });
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const TYPE_LABELS = {
    check_in_submitted:  'Check-in Submitted',
    check_in_reviewed:   'Trainer Feedback',
    check_in_assigned:   'Check-in Assigned',
    trainer_invite:      'Invitation Sent',
    invitation_sent:     'Invitation Sent',
    invite_accepted:     'Client Accepted',
    invite_declined:     'Client Declined',
    invitation_accepted: 'Invitation Accepted',
    invitation_declined: 'Invitation Declined',
    workout_assigned:    'Workout Assigned',
    workout_liked:       'Workout Liked',
    workout_commented:   'New Comment',
    workout_completed:   'Workout Completed',
    comment_liked:       'Comment Liked',
    message_liked:       'Message Liked',
};

// ── Group by date ──────────────────────────────────────────────────────────────

const groupByDate = (notifications) => {
    const today     = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const todayStr     = today.toDateString();
    const yesterdayStr = yesterday.toDateString();

    const groups = {};
    notifications.forEach((n) => {
        const d    = new Date(n.created_at);
        const dStr = d.toDateString();
        let label;
        if (dStr === todayStr)          label = 'Today';
        else if (dStr === yesterdayStr) label = 'Yesterday';
        else label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        if (!groups[label]) groups[label] = [];
        groups[label].push(n);
    });

    return Object.entries(groups).map(([title, data]) => ({ title, data }));
};

// ── Notification card ──────────────────────────────────────────────────────────

const NotifCard = ({ item, role, onPress, theme, styles }) => {
    const isRead  = item.read_at !== null;
    const { bg, initials } = resolveAvatar(item, role);
    const title   = item.data?.title ?? TYPE_LABELS[item.type] ?? item.type ?? 'Notification';
    const preview = item.data?.message ?? item.data?.body ?? null;

    return (
        <TouchableOpacity
            style={[styles.card, !isRead && styles.cardUnread]}
            onPress={onPress}
            activeOpacity={0.72}
        >
            {!isRead && <View style={styles.unreadBar} />}

            <View style={[styles.avatar, { backgroundColor: bg }]}>
                <Text style={styles.avatarText}>{initials}</Text>
            </View>

            <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                    <Text
                        style={[styles.cardTitle, !isRead && styles.cardTitleUnread]}
                        numberOfLines={1}
                    >
                        {title}
                    </Text>
                    <Text style={styles.cardTime}>{timeAgo(item.created_at)}</Text>
                </View>
                {preview ? (
                    <Text style={styles.cardPreview} numberOfLines={2}>{preview}</Text>
                ) : null}
            </View>
        </TouchableOpacity>
    );
};

// ── Screen ────────────────────────────────────────────────────────────────────

const AllNotificationsScreen = () => {
    const navigation = useNavigation();
    const route      = useRoute();
    const { theme }  = useTheme();
    const styles     = makeStyles(theme);

    const role = route.params?.role ?? 'trainer';

    const [sections, setSections]       = useState([]);
    const [loading, setLoading]         = useState(true);
    const [refreshing, setRefreshing]   = useState(false);
    const [totalCount, setTotalCount]   = useState(0);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchFn = role === 'client' ? getClientNotifications : getUserNotifications;
    const markFn  = role === 'client' ? markClientNotificationsAsRead : markNotificationsAsRead;

    const load = useCallback(async (opts = {}) => {
        if (opts.refresh) setRefreshing(true);
        else setLoading(true);
        try {
            const data = await fetchFn();
            const list = Array.isArray(data) ? data : [];
            setSections(groupByDate(list));
            setTotalCount(list.length);
            setUnreadCount(list.filter(n => !n.read_at).length);
        } catch {}
        finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [fetchFn]);

    useFocusEffect(
        useCallback(() => {
            load();
            markFn().catch(() => {});
        }, [load, markFn])
    );

    if (loading) {
        return (
            <ScreenWrapper title="All Notifications" showBack>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={theme.accent} />
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper title="All Notifications" showBack>
            <View style={styles.container}>

                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Notifications</Text>
                        {totalCount > 0 && (
                            <Text style={styles.subtitle}>
                                {totalCount} total
                                {unreadCount > 0 ? `  ·  ${unreadCount} unread` : ''}
                            </Text>
                        )}
                    </View>
                    {unreadCount > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{unreadCount}</Text>
                        </View>
                    )}
                </View>

                {sections.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIcon}>
                            <Text style={styles.emptyIconText}>🔔</Text>
                        </View>
                        <Text style={styles.emptyTitle}>All caught up</Text>
                        <Text style={styles.emptySubtitle}>
                            No notifications right now. Check back later.
                        </Text>
                    </View>
                ) : (
                    <SectionList
                        sections={sections}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => (
                            <NotifCard
                                item={item}
                                role={role}
                                theme={theme}
                                styles={styles}
                                onPress={() => navigation.navigate('NotificationDetail', { notification: item, role })}
                            />
                        )}
                        renderSectionHeader={({ section: { title } }) => (
                            <View style={styles.sectionHeaderRow}>
                                <Text style={styles.sectionHeader}>{title}</Text>
                                <View style={styles.sectionLine} />
                            </View>
                        )}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        stickySectionHeadersEnabled={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={() => load({ refresh: true })}
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

// ── Styles ────────────────────────────────────────────────────────────────────

const makeStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: theme.text,
    },
    subtitle: {
        fontSize: 13,
        color: theme.textMuted,
        marginTop: 2,
    },
    badge: {
        backgroundColor: theme.accent,
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
        minWidth: 28,
        alignItems: 'center',
    },
    badgeText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 16,
        marginTop: 8,
        marginBottom: 8,
    },
    sectionHeader: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        flexShrink: 0,
    },
    sectionLine: {
        flex: 1,
        height: StyleSheet.hairlineWidth,
        backgroundColor: theme.border,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 40,
    },
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
        overflow: 'hidden',
    },
    cardUnread: {
        backgroundColor: theme.accent + '08',
        borderColor: theme.accent + '30',
    },
    unreadBar: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 3,
        backgroundColor: theme.accent,
        borderTopLeftRadius: 14,
        borderBottomLeftRadius: 14,
    },
    avatar: {
        width: 46,
        height: 46,
        borderRadius: 23,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    avatarText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    cardBody: {
        flex: 1,
    },
    cardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 3,
        gap: 8,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.text,
        flex: 1,
    },
    cardTitleUnread: {
        fontWeight: '700',
    },
    cardTime: {
        fontSize: 12,
        color: theme.textMuted,
        flexShrink: 0,
    },
    cardPreview: {
        fontSize: 13,
        color: theme.textSecondary,
        lineHeight: 18,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        gap: 10,
    },
    emptyIcon: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: theme.accent + '20',
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyIconText: { fontSize: 30 },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.text,
        marginTop: 6,
    },
    emptySubtitle: {
        fontSize: 14,
        color: theme.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default AllNotificationsScreen;
