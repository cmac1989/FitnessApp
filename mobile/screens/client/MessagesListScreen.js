import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { getClientConversations, markClientMessagesAsRead } from '../../src/api/client';
import { getClientProfile } from '../../src/api/client';
import { useTheme } from '../../src/theme';

const MessagesListScreen = () => {
    const navigation = useNavigation();
    const { theme } = useTheme();
    const styles = makeStyles(theme);

    const [conversations, setConversations] = useState([]);
    const [trainerInfo, setTrainerInfo]     = useState(null);
    const [loading, setLoading]             = useState(true);
    const [error, setError]                 = useState(null);

    const loadConversations = useCallback(async (cancelled) => {
        try {
            setLoading(true);
            setError(null);

            const [convData, profileData] = await Promise.all([
                getClientConversations(),
                getClientProfile(),
            ]);

            if (cancelled?.value) return;

            const formatted = convData.map(item => ({
                id:          item.user.id,
                trainer:     { id: item.user.id, name: item.user.name },
                lastMessage: item.last_message.content,
                isMine:      item.last_message.is_mine,
                readAt:      item.last_message.read_at,
            }));
            setConversations(formatted);

            // Save trainer info so we can show "Message Trainer" if no conversations
            if (profileData?.trainer_id && profileData?.trainer_name) {
                setTrainerInfo({ id: profileData.trainer_id, name: profileData.trainer_name });
            }
        } catch (err) {
            if (!cancelled?.value) setError('Failed to load messages. Please try again.');
        } finally {
            if (!cancelled?.value) setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            const cancelled = { value: false };
            loadConversations(cancelled);
            markClientMessagesAsRead().catch(() => {});
            return () => { cancelled.value = true; };
        }, [loadConversations])
    );

    const openConversation = (trainer) => {
        navigation.navigate('ClientMessages', { trainer });
    };

    const renderItem = ({ item }) => {
        const isUnread = !item.readAt && !item.isMine;
        return (
            <TouchableOpacity
                style={[styles.messageItem, isUnread ? styles.unreadMessage : styles.readMessage]}
                onPress={() => openConversation(item.trainer)}
                activeOpacity={0.75}
            >
                <View style={styles.row}>
                    {isUnread && <View style={styles.unreadDot} />}
                    <Text style={[styles.trainerName, isUnread && styles.unreadTrainerName]}>
                        {item.trainer.name}
                    </Text>
                </View>
                <Text style={[styles.lastMessage, isUnread && styles.unreadLastMessage]} numberOfLines={1}>
                    {item.isMine ? `You: ${item.lastMessage}` : item.lastMessage}
                </Text>
            </TouchableOpacity>
        );
    };

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Messages</Text>
            {trainerInfo ? (
                <>
                    <Text style={styles.emptySubtitle}>Start a conversation with your trainer.</Text>
                    <TouchableOpacity
                        style={styles.startBtn}
                        onPress={() => openConversation(trainerInfo)}
                    >
                        <Text style={styles.startBtnText}>Message {trainerInfo.name}</Text>
                    </TouchableOpacity>
                </>
            ) : (
                <Text style={styles.emptySubtitle}>
                    Messages from your trainer will appear here.
                </Text>
            )}
        </View>
    );

    return (
        <ScreenWrapper title="Messages" showBack>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Messages</Text>
                    {trainerInfo && conversations.length > 0 && (
                        <TouchableOpacity
                            style={styles.composeBtn}
                            onPress={() => openConversation(trainerInfo)}
                        >
                            <Text style={styles.composeBtnText}>+ New</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color={theme.accent} style={styles.loader} />
                ) : error ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity style={styles.retryButton} onPress={() => loadConversations({})}>
                            <Text style={styles.retryButtonText}>Try Again</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={conversations}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderItem}
                        contentContainerStyle={[styles.listContent, conversations.length === 0 && styles.listEmpty]}
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: theme.text,
    },
    composeBtn: {
        backgroundColor: theme.primary,
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 18,
    },
    composeBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 13,
    },
    listContent: {
        paddingBottom: 20,
    },
    listEmpty: {
        flexGrow: 1,
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
        backgroundColor: theme.accent,
        marginRight: 8,
    },
    trainerName: {
        fontSize: 17,
        fontWeight: '500',
        color: theme.text,
    },
    unreadTrainerName: {
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
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
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
        marginBottom: 20,
    },
    startBtn: {
        backgroundColor: theme.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
    },
    startBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },
});

export default MessagesListScreen;
