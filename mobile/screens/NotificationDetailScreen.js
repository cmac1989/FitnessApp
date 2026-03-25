import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import ScreenWrapper from '../components/ScreenWrapper';
import { useTheme } from '../src/theme';
import { getClientCheckIn, getTrainerCheckIn } from '../src/api/checkin';
import { getAssignment } from '../src/api/assignment';

// ── Avatar helpers ─────────────────────────────────────────────────────────────

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

const extractNameFromMessage = (msg = '') => {
    if (!msg) return null;
    const match = msg.match(/^(.+?)(?:\s+(?:submitted|completed|accepted|declined|liked|assigned)|:\s)/);
    return match?.[1]?.trim() ?? null;
};

// ── Type colours (client side) ─────────────────────────────────────────────────

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

// ── Role-aware avatar resolver ─────────────────────────────────────────────────

const resolveAvatar = (notification, data, role) => {
    if (role === 'trainer') {
        const name = data.client_name
            ?? extractNameFromMessage(data.message ?? '')
            ?? '?';
        return { bg: hashColor(name), initials: getInitials(name), senderName: name };
    } else {
        const trainerName = data.trainer_name ?? null;
        const initials = trainerName
            ? getInitials(trainerName)
            : getInitials((() => {
                const t = notification.type ?? '';
                if (t.startsWith('check_in')) return 'Check In';
                if (t.startsWith('workout'))  return 'Workout';
                if (t.includes('message'))    return 'Message';
                if (t.includes('invite') || t.includes('invitation')) return 'Invite';
                return 'App';
            })());
        return {
            bg: getTypeColor(notification.type),
            initials,
            senderName: trainerName,
        };
    }
};

const inferRole = (data) => {
    if (data.client_name) return 'trainer';
    if (data.trainer_name) return 'client';
    return 'trainer';
};

// ── Labels & formatting ────────────────────────────────────────────────────────

const TYPE_LABELS = {
    check_in_submitted:  'Check-in Submitted',
    check_in_reviewed:   'Trainer Feedback',
    check_in_assigned:   'Check-in Assigned',
    trainer_invite:      'Trainer Invitation',
    invitation_sent:     'Trainer Invitation',
    invitation_accepted: 'Invitation Accepted',
    invitation_declined: 'Invitation Declined',
    invite_accepted:     'Client Accepted',
    invite_declined:     'Client Declined',
    workout_assigned:    'Workout Assigned',
    workout_liked:       'Workout Liked',
    workout_commented:   'New Comment',
    workout_completed:   'Workout Completed',
    comment_liked:       'Comment Liked',
    message_liked:       'Message Liked',
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long',
        month:   'long',
        day:     'numeric',
        year:    'numeric',
        hour:    'numeric',
        minute:  '2-digit',
    });
};

// ── Action config ──────────────────────────────────────────────────────────────
// Returns { label, fetch?, navigate } or null if no action is available.
// fetch   — async function returning the target object (or null if not needed)
// navigate — (navigation, fetchResult) => void

const buildAction = (notification, data, role) => {
    const type = notification.type ?? '';

    if (role === 'client') {
        if (type === 'check_in_assigned' && data.check_in_id) {
            return {
                label: 'Fill Out Check-in',
                fetch: () => getClientCheckIn(data.check_in_id),
                navigate: (nav, result) => nav.navigate('CheckInForm', { checkIn: result.check_in ?? result }),
            };
        }
        if (type === 'check_in_reviewed' && data.check_in_id) {
            return {
                label: 'View Trainer Feedback',
                fetch: () => getClientCheckIn(data.check_in_id),
                navigate: (nav, result) => nav.navigate('CheckInDetail', { checkIn: result.check_in ?? result }),
            };
        }
        if (
            ['workout_assigned', 'workout_liked', 'workout_commented', 'workout_completed'].includes(type)
            && data.assignment_id
        ) {
            const toComments = type === 'workout_commented';
            return {
                label: toComments ? 'View Comments' : (type === 'workout_assigned' ? 'View Workout' : 'Go to Workout'),
                fetch: () => getAssignment('client', data.assignment_id),
                navigate: (nav, result) => nav.navigate('AssignmentDetail', {
                    assignment: result.assignment ?? result,
                    role: 'client',
                    scrollToComments: toComments,
                }),
            };
        }
        if (type === 'comment_liked' && data.assignment_id) {
            return {
                label: 'View Comment',
                fetch: () => getAssignment('client', data.assignment_id),
                navigate: (nav, result) => nav.navigate('AssignmentDetail', {
                    assignment: result.assignment ?? result,
                    role: 'client',
                    scrollToComments: true,
                }),
            };
        }
        if (type === 'message_liked' && data.trainer_id) {
            return {
                label: 'Open Messages',
                fetch: null,
                navigate: (nav) => nav.navigate('ClientMessages', {
                    trainer: { id: data.trainer_id, name: data.trainer_name ?? 'Trainer' },
                }),
            };
        }
    }

    if (role === 'trainer') {
        if (type === 'check_in_submitted' && data.check_in_id) {
            return {
                label: 'Review Check-in',
                fetch: () => getTrainerCheckIn(data.check_in_id),
                navigate: (nav, result) => nav.navigate('CheckInReview', { checkIn: result.check_in ?? result }),
            };
        }
        if (
            ['workout_completed', 'workout_liked', 'workout_commented'].includes(type)
            && data.assignment_id
        ) {
            const toComments = type === 'workout_commented';
            return {
                label: toComments ? 'View Comments' : 'View Workout',
                fetch: () => getAssignment('trainer', data.assignment_id),
                navigate: (nav, result) => nav.navigate('AssignmentDetail', {
                    assignment: result.assignment ?? result,
                    role: 'trainer',
                    scrollToComments: toComments,
                }),
            };
        }
        if (['invite_accepted', 'invitation_accepted'].includes(type) && data.client_id) {
            return {
                label: 'View Client Profile',
                fetch: null,
                navigate: (nav) => nav.navigate('ClientDetails', {
                    clients: { id: data.client_id, name: data.client_name ?? 'Client' },
                }),
            };
        }
        if (type === 'comment_liked' && data.assignment_id) {
            return {
                label: 'View Comment',
                fetch: () => getAssignment('trainer', data.assignment_id),
                navigate: (nav, result) => nav.navigate('AssignmentDetail', {
                    assignment: result.assignment ?? result,
                    role: 'trainer',
                    scrollToComments: true,
                }),
            };
        }
        if (type === 'message_liked' && data.client_id) {
            return {
                label: 'Open Messages',
                fetch: null,
                navigate: (nav) => nav.navigate('Messages', {
                    client: { id: data.client_id, name: data.client_name ?? 'Client' },
                }),
            };
        }
    }

    return null;
};

// ── Screen ────────────────────────────────────────────────────────────────────

const NotificationDetailScreen = () => {
    const route      = useRoute();
    const navigation = useNavigation();
    const { theme }  = useTheme();
    const styles     = makeStyles(theme);

    const { notification, role: roleParam } = route.params;

    // Hide the bottom tab bar on this detail screen
    useFocusEffect(
        useCallback(() => {
            const parent = navigation.getParent();
            parent?.setOptions({ tabBarStyle: { display: 'none' } });
            return () => parent?.setOptions({
                tabBarStyle: {
                    backgroundColor: theme.navBar,
                    borderTopColor: theme.navBarBorder,
                    borderTopWidth: 1,
                    paddingVertical: 5,
                    height: 70,
                },
            });
        }, [navigation, theme])
    );

    const [actionLoading, setActionLoading] = useState(false);

    // Normalise data (may arrive as a double-encoded string)
    const data = (() => {
        if (!notification.data) return {};
        if (typeof notification.data === 'string') {
            try { return JSON.parse(notification.data); } catch { return {}; }
        }
        return notification.data;
    })();

    const role = roleParam ?? inferRole(data);
    const { bg, initials, senderName } = resolveAvatar(notification, data, role);

    const title   = data.title ?? TYPE_LABELS[notification.type] ?? notification.type ?? 'Notification';
    const message = data.message ?? data.body ?? null;

    // Metadata rows — hide internal IDs, show human-readable fields
    const SKIP   = new Set(['title', 'body', 'message']);
    const HIDDEN = new Set(['workout_id', 'assignment_id', 'client_id', 'trainer_id', 'check_in_id', 'invitation_token']);
    const META_LABELS = {
        client_name:   'From',
        trainer_name:  'From',
        week_start:    'Week of',
        workout_title: 'Workout',
    };

    const visibleMeta = Object.entries(data)
        .filter(([key]) => !SKIP.has(key) && !HIDDEN.has(key))
        .map(([key, value]) => {
            const label = META_LABELS[key]
                ?? key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            return { label, value: String(value) };
        });

    const action = buildAction(notification, data, role);

    const handleAction = async () => {
        if (!action) return;
        setActionLoading(true);
        try {
            let result = null;
            if (action.fetch) {
                result = await action.fetch();
            }
            action.navigate(navigation, result);
        } catch {
            Alert.alert('Error', 'Could not load the linked content. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <ScreenWrapper title="Notification" showBack>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Avatar hero */}
                <View style={styles.hero}>
                    <View style={[styles.avatarCircle, { backgroundColor: bg }]}>
                        <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                    <View style={styles.heroText}>
                        {senderName && senderName !== '?' && (
                            <Text style={styles.senderName}>{senderName}</Text>
                        )}
                        <Text style={styles.typeLabel}>{title}</Text>
                        {notification.created_at ? (
                            <Text style={styles.dateText}>{formatDate(notification.created_at)}</Text>
                        ) : null}
                    </View>
                </View>

                {/* Message body */}
                {message ? (
                    <View style={styles.card}>
                        <Text style={styles.cardHeading}>Message</Text>
                        <Text style={styles.messageText}>{message}</Text>
                    </View>
                ) : null}

                {/* Metadata */}
                {visibleMeta.length > 0 ? (
                    <View style={styles.card}>
                        {visibleMeta.map(({ label, value }, i) => (
                            <View
                                key={label}
                                style={[styles.metaRow, i < visibleMeta.length - 1 && styles.metaRowBorder]}
                            >
                                <Text style={styles.metaLabel}>{label}</Text>
                                <Text style={styles.metaValue}>{value}</Text>
                            </View>
                        ))}
                    </View>
                ) : null}

                {/* Action button */}
                {action ? (
                    <TouchableOpacity
                        style={[styles.actionBtn, actionLoading && styles.actionBtnDisabled]}
                        onPress={handleAction}
                        disabled={actionLoading}
                        activeOpacity={0.82}
                    >
                        {actionLoading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.actionBtnText}>{action.label}</Text>
                        )}
                    </TouchableOpacity>
                ) : null}
            </ScrollView>
        </ScreenWrapper>
    );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const makeStyles = (theme) => StyleSheet.create({
    scroll: {
        flex: 1,
        backgroundColor: theme.background,
    },
    content: {
        padding: 20,
        paddingBottom: 48,
    },

    // Hero
    hero: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        paddingVertical: 20,
        marginBottom: 20,
    },
    avatarCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
    },
    avatarText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 22,
        letterSpacing: 0.5,
    },
    heroText: {
        flex: 1,
        gap: 3,
    },
    senderName: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.text,
    },
    typeLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.textSecondary,
    },
    dateText: {
        fontSize: 12,
        color: theme.textMuted,
        marginTop: 2,
    },

    // Card
    card: {
        backgroundColor: theme.card,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.border,
        padding: 16,
        marginBottom: 14,
    },
    cardHeading: {
        fontSize: 11,
        fontWeight: '700',
        color: theme.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        marginBottom: 8,
    },
    messageText: {
        fontSize: 15,
        color: theme.text,
        lineHeight: 22,
    },

    // Meta rows
    metaRow: {
        paddingVertical: 11,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
    },
    metaRowBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.border,
    },
    metaLabel: {
        fontSize: 13,
        color: theme.textMuted,
        fontWeight: '500',
    },
    metaValue: {
        fontSize: 14,
        color: theme.text,
        fontWeight: '600',
        textAlign: 'right',
        flex: 1,
    },

    // Action button
    actionBtn: {
        backgroundColor: theme.accent,
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        minHeight: 52,
        shadowColor: theme.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    actionBtnDisabled: {
        opacity: 0.65,
    },
    actionBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
});

export default NotificationDetailScreen;
