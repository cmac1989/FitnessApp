import React, {useEffect, useState} from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import {getUserNotifications, markNotificationsAsRead} from '../../src/api/notification';
import {useFocusEffect} from '@react-navigation/native';

const NotificationsScreen = () => {
    const [notifications, setNotifications] = useState([]);

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
        try {
            const data = await getUserNotifications();
            setNotifications(data);
        } catch(error) {
            console.error('Error fetching notifications', error);
        }
    };

    const handleNotificationPress = (notification) => {
        console.log('Tapped notification:', notification);
        // Navigation logic based on notification.type could go here
    };

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
                    <Text
                        style={[
                            styles.notificationContent,
                            !isRead && styles.unreadNotificationContent,
                        ]}
                    >
                        {item.type}
                    </Text>
                </View>
                <Text style={styles.timestamp}>
                    {item.data?.title || item.data?.trainer || 'No details available'}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Notifications</Text>

            <FlatList
                data={notifications}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f8f8',
        padding: 20,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    listContent: {
        paddingBottom: 20,
    },
    notificationItem: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 10,
        marginBottom: 12,
        borderColor: '#ddd',
        borderWidth: 1,
    },
    readNotification: {
        backgroundColor: '#f0f0f0',
        borderColor: '#ccc',
    },
    unreadNotification: {
        backgroundColor: '#ffffff',
        borderColor: '#444',
    },
    notificationContent: {
        fontSize: 16,
        fontWeight: '500',
    },
    unreadNotificationContent: {
        fontWeight: 'bold',
    },
    timestamp: {
        fontSize: 13,
        color: '#777',
        marginTop: 5,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ff4d4d',
        marginRight: 8,
    },
});

export default NotificationsScreen;
