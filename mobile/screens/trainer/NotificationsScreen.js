import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, ActivityIndicator,
    TouchableOpacity,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { getUserNotifications, markNotificationsAsRead } from '../../src/api/notification';
import { useTheme } from '../../src/theme';

// ── Constants ─────────────────────────────────────────────────────────────────

const PREVIEW_LIMIT = 10;

const TYPE_LABELS = {
    check_in_submitted:  'Check-in Submitted',
    check_in_reviewed:   'Check-in Reviewed',
    check_in_assigned:   'Check-in Assigned',
    trainer_invite:      'Invitation Sent',
    invitation_sent:     'Invitation Sent',
    invite_accepted:     'Client Accepted',
    invite_declined:     'Client Declined',
    workout_assigned:    'Workout Assigned',
    workout_liked:       'Workout Liked',
    workout_commented:   'New Comment',
    workout_completed:   'Workout Completed',
    comment_liked:       'Comment Liked',
    message_liked:       'Message Liked',
};

// ── Avatar helpers ─────────────────────────────────────────────────────────────
// Trainer receives notifications FROM clients — avatar always reflects the client.

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

/**
 * All trainer-side notifications originate from a client.
 * Priority: explicit client_name field → name extracted from the message string.
 * Message format is always "{Client Name} verb..." or "{Client Name}: ...",
 * so we can reliably parse the name even for older stored notifications that
 * predate the client_name field.
 */
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

// ── Notification card ──────────────────────────────────────────────────────────

const NotifCard = ({ item, bg, initials, onPress, theme, styles }) => {
    const isRead  = item.read_at !== null;
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
                    <Text style={styles.cardPreview} numberOfLines={1}>{preview}</Text>
                ) : null}
            </View>
        </TouchableOpacity>
    );
};

// ── Screen ────────────────────────────────────────────────────────────────────

const NotificationsScreen = () => {
    const navigation = useNavigation();
    const { theme } = useTheme();
    const styles = makeStyles(theme);

    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            const cancelled = { value: false };

            const fetch = async () => {
                setLoading(true);
                try {
                    const data = await getUserNotifications();
                    if (!cancelled.value) setNotifications(Array.isArray(data) ? data : []);
                } catch {}
                finally {
                    if (!cancelled.value) setLoading(false);
                }
            };

            fetch();
            markNotificationsAsRead().catch(() => {});
            return () => { cancelled.value = true; };
        }, [])
    );

    if (loading) {
        return (
            <ScreenWrapper title="Notifications" showBack>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={theme.accent} />
                </View>
            </ScreenWrapper>
        );
    }

    const preview  = notifications.slice(0, PREVIEW_LIMIT);
    const unreadCt = notifications.filter(n => !n.read_at).length;

    const renderItem = ({ item }) => {
        const senderName = getClientSenderName(item);
        return (
            <NotifCard
                item={item}
                bg={hashColor(senderName)}
                initials={getInitials(senderName)}
                theme={theme}
                styles={styles}
                onPress={() => navigation.navigate('NotificationDetail', { notification: item, role: 'trainer' })}
            />
        );
    };

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
                <Text style={styles.emptyIconText}>🔔</Text>
            </View>
            <Text style={styles.emptyTitle}>All caught up</Text>
            <Text style={styles.emptySubtitle}>No notifications right now. Check back later.</Text>
        </View>
    );

    const ListFooter = () => {
        if (notifications.length <= PREVIEW_LIMIT) return null;
        return (
            <TouchableOpacity
                style={styles.seeAllBtn}
                onPress={() => navigation.navigate('AllNotifications', { role: 'trainer' })}
                activeOpacity={0.75}
            >
                <Text style={styles.seeAllText}>
                    See all {notifications.length} notifications
                </Text>
                <Text style={styles.seeAllChevron}>›</Text>
            </TouchableOpacity>
        );
    };

    return (
        <ScreenWrapper title="Notifications" showBack>
            <View style={styles.container}>

                <View style={styles.header}>
                    <Text style={styles.title}>Notifications</Text>
                    {unreadCt > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{unreadCt}</Text>
                        </View>
                    )}
                </View>

                <FlatList
                    data={preview}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={[
                        styles.listContent,
                        preview.length === 0 && styles.listEmpty,
                    ]}
                    ListEmptyComponent={renderEmpty}
                    ListFooterComponent={<ListFooter />}
                    showsVerticalScrollIndicator={false}
                />
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
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 14,
        gap: 10,
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: theme.text,
    },
    badge: {
        backgroundColor: theme.accent,
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 2,
        minWidth: 22,
        alignItems: 'center',
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 24,
    },
    listEmpty: {
        flexGrow: 1,
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
    seeAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.card,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.border,
        paddingVertical: 14,
        paddingHorizontal: 20,
        marginTop: 4,
        gap: 4,
    },
    seeAllText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.primary,
    },
    seeAllChevron: {
        fontSize: 18,
        color: theme.primary,
        fontWeight: '300',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        gap: 10,
        paddingTop: 60,
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

export default NotificationsScreen;
