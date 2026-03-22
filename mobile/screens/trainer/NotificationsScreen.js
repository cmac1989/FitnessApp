import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { getUserNotifications, markNotificationsAsRead } from '../../src/api/notification';
import { useTheme } from '../../src/theme';

const TYPE_LABELS = {
    check_in_submitted:  'New Check-in Submitted',
    check_in_reviewed:   'Check-in Reviewed',
    trainer_invite:      'Invitation Sent',
    invitation_sent:     'Invitation Sent',
    invite_accepted:     'Client Accepted Invitation',
    invite_declined:     'Client Declined Invitation',
    workout_assigned:    'Workout Assigned',
};

const NotificationsScreen = () => {
    const navigation = useNavigation();
    const { theme } = useTheme();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            const cancelled = { value: false };

            const fetchNotifications = async () => {
                setLoading(true);
                try {
                    const data = await getUserNotifications();
                    if (!cancelled.value) setNotifications(data);
                } catch (err) {
                    console.error('Error fetching notifications', err);
                } finally {
                    if (!cancelled.value) setLoading(false);
                }
            };

            fetchNotifications();
            markNotificationsAsRead().catch(() => {});
            return () => { cancelled.value = true; };
        }, [])
    );

    const styles = makeStyles(theme);

    if (loading) {
        return (
            <ScreenWrapper title="Notifications" showBack>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={theme.accent} />
                </View>
            </ScreenWrapper>
        );
    }

    const renderItem = ({ item }) => {
        const isRead = item.read_at !== null;
        const title = item.data?.title ?? TYPE_LABELS[item.type] ?? item.type ?? 'Notification';
        const detail = item.data?.message ?? item.data?.body ?? null;
        return (
            <TouchableOpacity
                style={[styles.notificationItem, isRead ? styles.readNotification : styles.unreadNotification]}
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

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>All Caught Up</Text>
            <Text style={styles.emptySubtitle}>No notifications right now. Check back later.</Text>
        </View>
    );

    return (
        <ScreenWrapper title="Notifications" showBack>
            <View style={styles.container}>
                <Text style={styles.title}>Notifications</Text>
                <FlatList
                    data={notifications}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={renderEmpty}
                />
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
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.background,
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
    notificationItem: {
        padding: 16,
        borderRadius: 10,
        marginBottom: 12,
        borderWidth: 1,
    },
    readNotification: {
        backgroundColor: theme.readItemBackground,
        borderColor: theme.border,
    },
    unreadNotification: {
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
