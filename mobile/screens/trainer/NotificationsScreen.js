import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';

const dummyNotifications = [
    {
        id: '1',
        type: 'message',
        content: 'Jordan Smith sent you a new message.',
        timestamp: '2m ago',
    },
    {
        id: '2',
        type: 'session_reminder',
        content: 'Upcoming session with Alex Lee at 5:00 PM.',
        timestamp: '30m ago',
    },
    {
        id: '3',
        type: 'workout_complete',
        content: 'Taylor Kim completed their workout.',
        timestamp: '1h ago',
    },
];

const NotificationsScreen = () => {
    const [notifications, setNotifications] = useState(dummyNotifications);

    const handleNotificationPress = (notification) => {
        console.log('Tapped notification:', notification);
        // You could navigate somewhere based on type, e.g.
        // if (notification.type === 'message') navigation.navigate('MessagesScreen')
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.notificationItem}
            onPress={() => handleNotificationPress(item)}
        >
            <Text style={styles.notificationContent}>{item.content}</Text>
            <Text style={styles.timestamp}>{item.timestamp}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Notifications</Text>

            <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
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
    notificationContent: {
        fontSize: 16,
        fontWeight: '500',
    },
    timestamp: {
        fontSize: 13,
        color: '#777',
        marginTop: 5,
    },
});

export default NotificationsScreen;
