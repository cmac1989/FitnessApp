import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { getUserNotifications, markNotificationsAsRead } from '../../src/api/notification';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../src/theme';

const NotificationsScreen = () => {
    const { theme } = useTheme();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        React.useCallback(() => {
            fetchNotifications();
            clearNotifications();
        }, [])
    );

    const clearNotifications = async () => {
        try {
            await markNotificationsAsRead();
        } catch (error) {
            console.error('Error clearing notifications', error);
        }
    };

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const data = await getUserNotifications();
            setNotifications(data);
        } catch (error) {
            console.error('Error fetching notifications', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNotificationPress = (notification) => {
        console.log('Tapped notification:', notification);
    };

    const styles = makeStyles(theme);

    const renderItem = ({ item }) => {
        const isRead = item.read_at !== null;
        return (
            <TouchableOpacity
                style={[
                    styles.notificationItem,
                    isRead ? styles.readNotification : styles.unreadNotification,
                ]}
                onPress={() => handleNotificationPress(item)}
            >
                <View style={styles.row}>
                    {!isRead && <View style={styles.unreadDot} />}
                    <Text style={[styles.notificationContent, !isRead && styles.unreadContent]}>
                        {item.type}
                    </Text>
                </View>
                <Text style={styles.notificationDetail}>
                    {item.data?.title || item.data?.trainer || 'No details available'}
                </Text>
            </TouchableOpacity>
        );
    };

    const renderEmpty = () => {
        if (loading) return null;
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>All Caught Up</Text>
                <Text style={styles.emptySubtitle}>No notifications right now. Check back later.</Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Notifications</Text>

            {loading ? (
                <ActivityIndicator size="large" color={theme.accent} style={styles.loader} />
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={renderEmpty}
                />
            )}
        </View>
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
        backgroundColor: theme.error,
        marginRight: 8,
    },
    notificationContent: {
        fontSize: 15,
        fontWeight: '500',
        color: theme.text,
    },
    unreadContent: {
        fontWeight: 'bold',
    },
    notificationDetail: {
        fontSize: 13,
        color: theme.textSecondary,
        marginTop: 5,
    },
    loader: {
        marginTop: 40,
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
