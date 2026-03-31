import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import Avatar from '../../components/Avatar';
import { getClientNotifications, markClientNotificationsAsRead } from '../../src/api/client';
import { getPendingInvitations, acceptInvitation, declineInvitation } from '../../src/api/invitations';
import { useTheme } from '../../src/theme';
import { useToast } from '../../src/context/ToastContext';

// ── Constants ─────────────────────────────────────────────────────────────────

const PREVIEW_LIMIT = 10;

const TYPE_LABELS = {
    check_in_submitted:  'Check-in Submitted',
    check_in_reviewed:   'Trainer Feedback',
    check_in_assigned:   'Check-in Assigned',
    trainer_invite:      'Trainer Invitation',
    invitation_sent:     'Trainer Invitation',
    invitation_accepted: 'Invitation Accepted',
    invitation_declined: 'Invitation Declined',
    workout_assigned:    'Workout Assigned',
    workout_liked:       'Workout Liked',
    workout_commented:   'New Comment',
    workout_completed:   'Workout Completed',
    comment_liked:       'Comment Liked',
    message_liked:       'Message Liked',
};

// ── Avatar colour helpers ──────────────────────────────────────────────────────
// Client receives notifications FROM the trainer.
// Avatar falls back to type-based colour so each category stays visually distinct.

const TYPE_COLORS = {
    check_in_assigned:   '#10b981',
    check_in_reviewed:   '#10b981',
    check_in_submitted:  '#10b981',
    workout_assigned:    '#f59e0b',
    workout_liked:       '#f59e0b',
    workout_commented:   '#f59e0b',
    workout_completed:   '#f59e0b',
    comment_liked:       '#f59e0b',
    trainer_invite:      '#8b5cf6',
    invitation_sent:     '#8b5cf6',
    invitation_accepted: '#8b5cf6',
    invitation_declined: '#8b5cf6',
    message_liked:       '#3b82f6',
};
const DEFAULT_TYPE_COLOR = '#6366f1';

const getTypeColor = (type) => TYPE_COLORS[type] ?? DEFAULT_TYPE_COLOR;

/**
 * Returns the name to use for initials.
 * For the client, the sender is always the trainer.
 */
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

const NotifCard = ({ item, senderName, bg, onPress, theme, styles }) => {
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

            <Avatar
                name={senderName}
                photoUri={item.data?.sender_photo ?? null}
                backgroundColor={bg}
                size={46}
            />

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

// ── Invitation card ───────────────────────────────────────────────────────────

const InviteCard = ({ invite, onAccept, onDecline, theme, styles }) => (
    <View style={styles.inviteCard}>
        <View style={styles.inviteCardLeft}>
            <Avatar
                name={invite.trainer_name ?? 'Trainer'}
                photoUri={invite.trainer_photo ?? null}
                backgroundColor={getTypeColor('trainer_invite')}
                size={46}
            />
            <View style={styles.inviteBody}>
                <Text style={styles.inviteTitle}>Trainer Invitation</Text>
                <Text style={styles.inviteText} numberOfLines={2}>
                    <Text style={{ fontWeight: '700' }}>{invite.trainer_name}</Text>
                    {' '}wants to be your trainer
                </Text>
                <Text style={styles.inviteMeta}>Expires {invite.expires_at}</Text>
            </View>
        </View>
        <View style={styles.inviteActions}>
            <TouchableOpacity style={styles.acceptBtn} onPress={() => onAccept(invite)} activeOpacity={0.8}>
                <Text style={styles.acceptBtnText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.declineBtn} onPress={() => onDecline(invite)} activeOpacity={0.8}>
                <Text style={styles.declineBtnText}>Decline</Text>
            </TouchableOpacity>
        </View>
    </View>
);

// ── Screen ────────────────────────────────────────────────────────────────────

const NotificationsScreen = () => {
    const navigation = useNavigation();
    const { theme }  = useTheme();
    const styles     = makeStyles(theme);
    const { showToast } = useToast();

    const [notifications, setNotifications] = useState([]);
    const [invitations, setInvitations]     = useState([]);
    const [loading, setLoading]             = useState(true);

    const fetchAll = useCallback(async (cancelled) => {
        setLoading(true);
        try {
            const [notifs, invites] = await Promise.all([
                getClientNotifications(),
                getPendingInvitations(),
            ]);
            if (!cancelled?.value) {
                setNotifications(Array.isArray(notifs) ? notifs : []);
                setInvitations(Array.isArray(invites) ? invites : []);
            }
        } catch {}
        finally {
            if (!cancelled?.value) setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            const cancelled = { value: false };
            fetchAll(cancelled);
            markClientNotificationsAsRead().catch(() => {});
            return () => { cancelled.value = true; };
        }, [fetchAll])
    );

    const handleAccept = (invite) => {
        Alert.alert(
            'Accept Invitation',
            `Link with ${invite.trainer_name} as your trainer?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Accept',
                    onPress: async () => {
                        try {
                            const res = await acceptInvitation(invite.token);
                            showToast(res.message, 'success');
                            setInvitations(prev => prev.filter(i => i.id !== invite.id));
                        } catch (err) {
                            showToast(err.response?.data?.error ?? 'Could not accept invitation.', 'error');
                        }
                    },
                },
            ]
        );
    };

    const handleDecline = (invite) => {
        Alert.alert(
            'Decline Invitation',
            `Decline ${invite.trainer_name}'s invitation?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Decline',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await declineInvitation(invite.token);
                            setInvitations(prev => prev.filter(i => i.id !== invite.id));
                        } catch {
                            showToast('Could not decline invitation.', 'error');
                        }
                    },
                },
            ]
        );
    };

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

    const renderItem = ({ item }) => (
        <NotifCard
            item={item}
            senderName={getTrainerSenderName(item)}
            bg={getTypeColor(item.type)}
            theme={theme}
            styles={styles}
            onPress={() => navigation.navigate('NotificationDetail', { notification: item, role: 'client' })}
        />
    );

    const ListHeader = () => {
        if (invitations.length === 0) return null;
        return (
            <View style={styles.inviteSection}>
                <Text style={styles.sectionLabel}>PENDING INVITATIONS</Text>
                {invitations.map(invite => (
                    <InviteCard
                        key={invite.id}
                        invite={invite}
                        onAccept={handleAccept}
                        onDecline={handleDecline}
                        theme={theme}
                        styles={styles}
                    />
                ))}
                {notifications.length > 0 && <View style={styles.divider} />}
            </View>
        );
    };

    const ListFooter = () => {
        if (notifications.length <= PREVIEW_LIMIT) return null;
        return (
            <TouchableOpacity
                style={styles.seeAllBtn}
                onPress={() => navigation.navigate('AllNotifications', { role: 'client' })}
                activeOpacity={0.75}
            >
                <Text style={styles.seeAllText}>
                    See all {notifications.length} notifications
                </Text>
                <Text style={styles.seeAllChevron}>›</Text>
            </TouchableOpacity>
        );
    };

    const renderEmpty = () => {
        if (invitations.length > 0) return null;
        return (
            <View style={styles.emptyContainer}>
                <View style={styles.emptyIcon}>
                    <Text style={styles.emptyIconText}>🔔</Text>
                </View>
                <Text style={styles.emptyTitle}>All caught up</Text>
                <Text style={styles.emptySubtitle}>No notifications right now. Check back later.</Text>
            </View>
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
                        preview.length === 0 && invitations.length === 0 && styles.listEmpty,
                    ]}
                    ListHeaderComponent={<ListHeader />}
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
    sectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: theme.textMuted,
        letterSpacing: 0.8,
        marginBottom: 10,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 24,
    },
    listEmpty: {
        flexGrow: 1,
    },
    // Notification card
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
    // Invitation card
    inviteSection: {
        marginBottom: 4,
    },
    inviteCard: {
        backgroundColor: theme.card,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.primary + '44',
        borderLeftWidth: 3,
        borderLeftColor: theme.primary,
        padding: 14,
        marginBottom: 10,
        gap: 12,
    },
    inviteCardLeft: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    inviteBody: {
        flex: 1,
    },
    inviteTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.primary,
        marginBottom: 2,
    },
    inviteText: {
        fontSize: 14,
        color: theme.text,
        lineHeight: 20,
    },
    inviteMeta: {
        fontSize: 12,
        color: theme.textMuted,
        marginTop: 4,
    },
    inviteActions: {
        flexDirection: 'row',
        gap: 10,
    },
    acceptBtn: {
        flex: 1,
        backgroundColor: theme.primary,
        borderRadius: 10,
        paddingVertical: 10,
        alignItems: 'center',
    },
    acceptBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    declineBtn: {
        flex: 1,
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: 10,
        paddingVertical: 10,
        alignItems: 'center',
        backgroundColor: theme.card,
    },
    declineBtnText: {
        color: theme.textSecondary,
        fontWeight: '600',
        fontSize: 14,
    },
    divider: {
        height: 1,
        backgroundColor: theme.border,
        marginBottom: 16,
        marginTop: 4,
    },
    // See all
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
    // Empty
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
