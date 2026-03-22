import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { getClientNotifications, markClientNotificationsAsRead } from '../../src/api/client';
import { getPendingInvitations, acceptInvitation, declineInvitation } from '../../src/api/invitations';
import { useTheme } from '../../src/theme';

// ── Type labels ───────────────────────────────────────────────────────────────
const TYPE_LABELS = {
    check_in_submitted:  'Check-in Submitted',
    check_in_reviewed:   'Trainer Feedback Received',
    trainer_invite:      'Trainer Invitation',
    invitation_sent:     'Trainer Invitation',
    invitation_accepted: 'Invitation Accepted',
    invitation_declined: 'Invitation Declined',
    workout_assigned:    'New Workout Assigned',
};

// ── Invitation card ───────────────────────────────────────────────────────────
const InviteCard = ({ invite, onAccept, onDecline, styles }) => (
    <View style={styles.inviteCard}>
        <Text style={styles.inviteTitle}>Trainer Invitation</Text>
        <Text style={styles.inviteBody}>
            <Text style={{ fontWeight: '700' }}>{invite.trainer_name}</Text> has invited you to be their client.
        </Text>
        <Text style={styles.inviteMeta}>Expires {invite.expires_at}</Text>
        <View style={styles.inviteActions}>
            <TouchableOpacity style={[styles.inviteBtn, styles.acceptBtn]} onPress={() => onAccept(invite)}>
                <Text style={styles.acceptBtnText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.inviteBtn, styles.declineBtn]} onPress={() => onDecline(invite)}>
                <Text style={styles.declineBtnText}>Decline</Text>
            </TouchableOpacity>
        </View>
    </View>
);

// ── Main screen ───────────────────────────────────────────────────────────────
const NotificationsScreen = () => {
    const navigation = useNavigation();
    const { theme } = useTheme();
    const styles = makeStyles(theme);

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
                setNotifications(notifs);
                setInvitations(invites);
            }
        } catch (err) {
            console.error('Error fetching notifications/invitations', err);
        } finally {
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
                            Alert.alert('Linked!', res.message);
                            setInvitations(prev => prev.filter(i => i.id !== invite.id));
                        } catch (err) {
                            Alert.alert('Error', err.response?.data?.error ?? 'Could not accept invitation.');
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
                        } catch (err) {
                            Alert.alert('Error', 'Could not decline invitation.');
                        }
                    },
                },
            ]
        );
    };

    const renderNotification = ({ item }) => {
        const isRead = item.read_at !== null;
        const title = item.data?.title ?? TYPE_LABELS[item.type] ?? item.type ?? 'Notification';
        const detail = item.data?.message ?? item.data?.body ?? null;
        return (
            <TouchableOpacity
                style={[styles.notificationItem, isRead ? styles.readItem : styles.unreadItem]}
                onPress={() => navigation.navigate('NotificationDetail', { notification: item })}
                activeOpacity={0.75}
            >
                <View style={styles.row}>
                    {!isRead && <View style={styles.unreadDot} />}
                    <Text style={[styles.notificationContent, !isRead && styles.unreadContent]}>
                        {title}
                    </Text>
                </View>
                {detail ? (
                    <Text style={styles.notificationDetail}>{detail}</Text>
                ) : null}
            </TouchableOpacity>
        );
    };

    const ListHeader = () => {
        if (invitations.length === 0) return null;
        return (
            <View style={styles.inviteSection}>
                <Text style={styles.inviteSectionTitle}>Pending Invitations</Text>
                {invitations.map(invite => (
                    <InviteCard
                        key={invite.id}
                        invite={invite}
                        onAccept={handleAccept}
                        onDecline={handleDecline}
                        styles={styles}
                    />
                ))}
                {notifications.length > 0 && <View style={styles.divider} />}
            </View>
        );
    };

    const renderEmpty = () => {
        if (loading || invitations.length > 0) return null;
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>All Caught Up</Text>
                <Text style={styles.emptySubtitle}>No notifications right now. Check back later.</Text>
            </View>
        );
    };

    return (
        <ScreenWrapper title="Notifications" showBack>
            <View style={styles.container}>
                <Text style={styles.title}>Notifications</Text>

                {loading ? (
                    <ActivityIndicator size="large" color={theme.accent} style={styles.loader} />
                ) : (
                    <FlatList
                        data={notifications}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderNotification}
                        contentContainerStyle={styles.listContent}
                        ListHeaderComponent={<ListHeader />}
                        ListEmptyComponent={renderEmpty}
                    />
                )}
            </View>
        </ScreenWrapper>
    );
};

const makeStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
        padding: 20,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 20,
        color: theme.text,
    },
    listContent: {
        paddingBottom: 20,
    },
    loader: {
        marginTop: 40,
    },
    // ── Invitations ──
    inviteSection: {
        marginBottom: 4,
    },
    inviteSectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        marginBottom: 10,
    },
    inviteCard: {
        backgroundColor: theme.card,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: theme.primary,
        borderWidth: 1,
        borderColor: theme.border,
    },
    inviteTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.text,
        marginBottom: 4,
    },
    inviteBody: {
        fontSize: 14,
        color: theme.textSecondary,
        lineHeight: 20,
    },
    inviteMeta: {
        fontSize: 12,
        color: theme.textMuted,
        marginTop: 4,
        marginBottom: 12,
    },
    inviteActions: {
        flexDirection: 'row',
        gap: 10,
    },
    inviteBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    acceptBtn: {
        backgroundColor: theme.primary,
    },
    acceptBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    declineBtn: {
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.card,
    },
    declineBtnText: {
        color: theme.textSecondary,
        fontWeight: '600',
        fontSize: 14,
    },
    divider: {
        height: 1,
        backgroundColor: theme.divider,
        marginBottom: 16,
    },
    // ── Notifications ──
    notificationItem: {
        padding: 16,
        borderRadius: 10,
        marginBottom: 12,
        borderWidth: 1,
    },
    readItem: {
        backgroundColor: theme.readItemBackground,
        borderColor: theme.border,
    },
    unreadItem: {
        backgroundColor: theme.unreadItemBackground,
        borderColor: theme.unreadItemBorder,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.accent,
        marginRight: 8,
    },
    notificationContent: {
        fontSize: 15,
        fontWeight: '500',
        color: theme.text,
        flex: 1,
    },
    unreadContent: {
        fontWeight: 'bold',
    },
    notificationDetail: {
        fontSize: 13,
        color: theme.textSecondary,
        marginTop: 5,
    },
    // ── Empty ──
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

export default NotificationsScreen;
