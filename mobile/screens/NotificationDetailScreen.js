import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRoute } from '@react-navigation/native';
import ScreenWrapper from '../components/ScreenWrapper';
import { useTheme } from '../src/theme';

const TYPE_LABELS = {
    check_in_submitted:  'New Check-in Submitted',
    check_in_reviewed:   'Trainer Feedback Received',
    trainer_invite:      'Trainer Invitation',
    invitation_sent:     'Trainer Invitation',
    invitation_accepted: 'Invitation Accepted',
    invitation_declined: 'Invitation Declined',
    invite_accepted:     'Client Accepted Invitation',
    invite_declined:     'Client Declined Invitation',
    workout_assigned:    'New Workout Assigned',
    workout_liked:       'Workout Liked',
    workout_commented:   'New Comment on Workout',
    workout_completed:   'Client Completed Workout',
    message_liked:       'Message Liked',
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
};

const NotificationDetailScreen = () => {
    const route = useRoute();
    const { theme } = useTheme();
    const { notification } = route.params;

    const styles = makeStyles(theme);

    // data may arrive as a double-encoded string from old notifications
    const data = (() => {
        if (!notification.data) return {};
        if (typeof notification.data === 'string') {
            try { return JSON.parse(notification.data); } catch { return {}; }
        }
        return notification.data;
    })();

    const title = data.title
        ?? TYPE_LABELS[notification.type]
        ?? notification.type
        ?? 'Notification';

    const message = data.message ?? data.body ?? null;

    // Gather any extra metadata to display (exclude internal/UI fields)
    const skipKeys = new Set(['title', 'body', 'message']);
    const metaEntries = typeof data === 'object' && !Array.isArray(data)
        ? Object.entries(data).filter(([key]) => !skipKeys.has(key))
        : [];

    const metaLabels = {
        client_name:      'Client',
        trainer_name:     'Trainer',
        week_start:       'Week of',
        workout_id:       null, // hide raw IDs
        assignment_id:    null,
        client_id:        null,
        trainer_id:       null,
        check_in_id:      null,
        invitation_token: null,
    };

    const visibleMeta = metaEntries
        .map(([key, value]) => {
            if (key in metaLabels) {
                if (metaLabels[key] === null) return null; // skip
                return { label: metaLabels[key], value: String(value) };
            }
            // Humanize unknown keys
            const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            return { label, value: String(value) };
        })
        .filter(Boolean);

    return (
        <ScreenWrapper title="Notification" showBack>
            <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>{title}</Text>
                    {notification.created_at ? (
                        <Text style={styles.date}>{formatDate(notification.created_at)}</Text>
                    ) : null}
                </View>

                {message ? (
                    <View style={styles.card}>
                        <Text style={styles.message}>{message}</Text>
                    </View>
                ) : null}

                {visibleMeta.length > 0 ? (
                    <View style={styles.card}>
                        {visibleMeta.map(({ label, value }) => (
                            <View key={label} style={styles.metaRow}>
                                <Text style={styles.metaLabel}>{label}</Text>
                                <Text style={styles.metaValue}>{value}</Text>
                            </View>
                        ))}
                    </View>
                ) : null}
            </ScrollView>
        </ScreenWrapper>
    );
};

const makeStyles = (theme) => StyleSheet.create({
    scroll: {
        flex: 1,
        backgroundColor: theme.background,
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: theme.text,
        marginBottom: 6,
    },
    date: {
        fontSize: 13,
        color: theme.textMuted,
    },
    card: {
        backgroundColor: theme.card,
        borderRadius: 12,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: theme.border,
    },
    message: {
        fontSize: 16,
        color: theme.text,
        lineHeight: 24,
    },
    metaRow: {
        marginBottom: 10,
    },
    metaLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: theme.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    metaValue: {
        fontSize: 15,
        color: theme.text,
    },
});

export default NotificationDetailScreen;
