import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { fetchConversations } from '../../src/api/message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../src/theme';

const MessagesListScreen = () => {
    const navigation = useNavigation();
    const { theme } = useTheme();
    const [conversations, setConversations] = useState([]);
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const getUserInfo = async () => {
        try {
            const userData = await AsyncStorage.getItem('user');
            if (userData) {
                setUserInfo(JSON.parse(userData));
            }
        } catch (err) {
            console.error('Error retrieving user data:', err);
        }
    };

    const loadConversations = async () => {
        if (!userInfo) return;
        setLoading(true);
        try {
            const data = await fetchConversations();
            const formatted = data.map(item => ({
                id: item.user.id,
                client: { name: item.user.name },
                lastMessage: item.last_message.content,
                readAt: item.last_message.read_at,
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

    useEffect(() => { getUserInfo(); }, []);
    useEffect(() => { if (userInfo) loadConversations(); }, [userInfo]);

    const styles = makeStyles(theme);

    const renderItem = ({ item }) => {
        const isUnread = !item.readAt;
        return (
            <TouchableOpacity
                style={[
                    styles.messageItem,
                    isUnread ? styles.unreadMessage : styles.readMessage,
                ]}
                onPress={() => navigation.navigate('Messages', { client: { id: item.id, name: item.client.name } })}
            >
                <View style={styles.row}>
                    {isUnread && <View style={styles.unreadDot} />}
                    <Text style={[styles.clientName, isUnread && styles.unreadClientName]}>
                        {item.client.name}
                    </Text>
                </View>
                <Text style={[styles.lastMessage, isUnread && styles.unreadLastMessage]} numberOfLines={1}>
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
                <ActivityIndicator size="large" color={theme.accent} style={styles.loader} />
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
    messageItem: {
        padding: 16,
        borderRadius: 10,
        marginBottom: 12,
        borderWidth: 1,
    },
    readMessage: {
        backgroundColor: theme.readItemBackground,
        borderColor: theme.border,
    },
    unreadMessage: {
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
    clientName: {
        fontSize: 17,
        fontWeight: '500',
        color: theme.text,
    },
    unreadClientName: {
        fontWeight: 'bold',
    },
    lastMessage: {
        fontSize: 14,
        color: theme.textSecondary,
        marginTop: 4,
    },
    unreadLastMessage: {
        fontWeight: '600',
        color: theme.text,
    },
    loader: {
        marginTop: 40,
    },
    errorText: {
        color: theme.error,
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 12,
    },
    retryButton: {
        backgroundColor: theme.accent,
        paddingVertical: 10,
        paddingHorizontal: 28,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
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

export default MessagesListScreen;
