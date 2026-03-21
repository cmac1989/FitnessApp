import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { fetchConversations } from '../../src/api/message';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MessagesListScreen = () => {
    const navigation = useNavigation();
    const [conversations, setConversations] = useState([]);
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch user data from AsyncStorage
    const getUserInfo = async () => {
        try {
            const userData = await AsyncStorage.getItem('user');
            if (userData) {
                const parsedUserData = JSON.parse(userData);
                setUserInfo(parsedUserData);
            }
        } catch (err) {
            console.error('Error retrieving user data:', err);
        }
    };

    // Fetch conversations after user data is loaded
    const loadConversations = async () => {
        if (!userInfo) return;

        setLoading(true);

        try {
            const data = await fetchConversations();
            console.log('Fetched conversations:', data);

            const formatted = data.map(item => ({
                id: item.user.id,
                client: { name: item.user.name },
                lastMessage: item.last_message.content,
                readAt: item.last_message.read_at, // assuming your API sends this
            }));

            setConversations(formatted);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch conversations:', err);
            setError('Failed to load messages. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getUserInfo();
    }, []);

    useEffect(() => {
        if (userInfo) {
            loadConversations();
        }
    }, [userInfo]);

    const handleOpenChat = (clientId, clientName) => {
        navigation.navigate('Messages', { client: { id: clientId, name: clientName } });
    };

    const renderItem = ({ item }) => {
        const isUnread = !item.readAt;

        return (
            <TouchableOpacity
                style={[
                    styles.messageItem,
                    isUnread ? styles.unreadMessage : styles.readMessage
                ]}
                onPress={() => handleOpenChat(item.id, item.client.name)}
            >
                <View style={styles.row}>
                    {isUnread && <View style={styles.unreadDot} />}
                    <Text
                        style={[
                            styles.clientName,
                            isUnread && styles.unreadClientName
                        ]}
                    >
                        {item.client.name}
                    </Text>
                </View>
                <Text
                    style={[
                        styles.lastMessage,
                        isUnread && styles.unreadLastMessage
                    ]}
                >
                    {item.lastMessage}
                </Text>
            </TouchableOpacity>
        );
    };

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Messages</Text>
            <Text style={styles.emptySubtitle}>When a client messages you, it will appear here.</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Messages</Text>

            {loading ? (
                <ActivityIndicator size="large" color="#007bff" style={styles.loader} />
            ) : error ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={loadConversations}>
                        <Text style={styles.retryButtonText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={conversations}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={renderEmpty}
                />
            )}
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
    messageItem: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 10,
        marginBottom: 12,
        borderColor: '#ddd',
        borderWidth: 1,
    },
    clientName: {
        fontSize: 18,
        fontWeight: '500',
    },
    lastMessage: {
        fontSize: 14,
        color: '#555',
        marginTop: 4,
    },
    errorText: {
        color: 'red',
        fontSize: 16,
        marginTop: 20,
    },
    readMessage: {
        backgroundColor: '#f0f0f0',
        borderColor: '#ccc',
    },
    unreadMessage: {
        backgroundColor: '#ffffff',
        borderColor: '#444',
    },
    unreadClientName: {
        fontWeight: 'bold',
        color: '#111',
    },
    unreadLastMessage: {
        fontWeight: '600',
        color: '#222',
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ff4d4d',
        marginRight: 8,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    loader: {
        marginTop: 40,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
        paddingHorizontal: 30,
    },
    emptyIcon: {
        fontSize: 52,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        lineHeight: 20,
    },
    retryButton: {
        marginTop: 16,
        backgroundColor: '#007bff',
        paddingVertical: 10,
        paddingHorizontal: 28,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
});

export default MessagesListScreen;
