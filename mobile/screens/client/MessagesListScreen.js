import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { getClientConversations, markClientMessagesAsRead, getClientProfile } from '../../src/api/client';
import { useTheme } from '../../src/theme';

// ── Helpers ───────────────────────────────────────────────────────────────────

const AVATAR_COLORS = ['#6366f1', '#f43f5e', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

const avatarColor = (name = '') => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const getInitials = (name = '') => {
    const parts = name.trim().split(' ');
    return parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : name.substring(0, 2).toUpperCase();
};

// ── Avatar ────────────────────────────────────────────────────────────────────

const Avatar = ({ name, size = 46 }) => {
    const bg = avatarColor(name);
    return (
        <View style={[avatarStyles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
            <Text style={[avatarStyles.initials, { fontSize: size * 0.36 }]}>{getInitials(name)}</Text>
        </View>
    );
};
const avatarStyles = StyleSheet.create({
    circle: { alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    initials: { color: '#fff', fontWeight: '700' },
});

// ── Screen ────────────────────────────────────────────────────────────────────

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
                isDeleted:   item.last_message.is_deleted,
                isMine:      item.last_message.is_mine,
                readAt:      item.last_message.read_at,
            }));
            setConversations(formatted);

            if (profileData?.trainer_id && profileData?.trainer_name) {
                setTrainerInfo({ id: profileData.trainer_id, name: profileData.trainer_name });
            }
        } catch {
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

    const previewText = (item) => {
        if (item.isDeleted) return item.isMine ? 'You deleted a message' : 'Message deleted';
        if (!item.lastMessage) return '';
        return item.isMine ? `You: ${item.lastMessage}` : item.lastMessage;
    };

    const renderItem = ({ item }) => {
        const isUnread = !item.readAt && !item.isMine;

        return (
            <TouchableOpacity
                style={[styles.card, isUnread && styles.cardUnread]}
                onPress={() => openConversation(item.trainer)}
                activeOpacity={0.7}
            >
                <Avatar name={item.trainer.name} size={48} />

                <View style={styles.rowContent}>
                    <View style={styles.rowTop}>
                        <Text style={[styles.name, isUnread && styles.nameUnread]} numberOfLines={1}>
                            {item.trainer.name}
                        </Text>
                        {isUnread && <View style={styles.unreadDot} />}
                    </View>
                    <Text
                        style={[styles.preview, isUnread && styles.previewUnread]}
                        numberOfLines={1}
                    >
                        {previewText(item)}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            {trainerInfo ? (
                <>
                    <Avatar name={trainerInfo.name} size={72} />
                    <Text style={styles.emptyTitle}>{trainerInfo.name}</Text>
                    <Text style={styles.emptySubtitle}>Send your trainer a message to get started.</Text>
                    <TouchableOpacity
                        style={styles.startBtn}
                        onPress={() => openConversation(trainerInfo)}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.startBtnText}>Say Hello</Text>
                    </TouchableOpacity>
                </>
            ) : (
                <>
                    <View style={styles.emptyIcon}>
                        <Text style={styles.emptyIconText}>✉</Text>
                    </View>
                    <Text style={styles.emptyTitle}>No Messages</Text>
                    <Text style={styles.emptySubtitle}>
                        Messages from your trainer will appear here.
                    </Text>
                </>
            )}
        </View>
    );

    return (
        <ScreenWrapper title="Messages" showBack>
            <View style={styles.subHeader}>
                <Text style={styles.subHeaderTitle}>Messages</Text>
                {trainerInfo && conversations.length > 0 && (
                    <TouchableOpacity
                        style={styles.composeBtn}
                        onPress={() => openConversation(trainerInfo)}
                        activeOpacity={0.8}
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
                    <TouchableOpacity style={styles.retryBtn} onPress={() => loadConversations({})}>
                        <Text style={styles.retryBtnText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={conversations}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={[styles.list, conversations.length === 0 && styles.listEmpty]}
                    ListEmptyComponent={renderEmpty}
                />
            )}
        </ScreenWrapper>
    );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const makeStyles = (theme) => StyleSheet.create({
    subHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
    },
    subHeaderTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: theme.text,
    },
    composeBtn: {
        backgroundColor: theme.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    composeBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },

    loader: { marginTop: 60 },

    // Conversation rows
    list: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 16 },
    listEmpty: { flexGrow: 1 },

    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.card,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.border,
        padding: 14,
        marginBottom: 10,
        gap: 12,
    },
    cardUnread: {
        borderColor: theme.primary + '55',
        backgroundColor: theme.primary + '08',
    },
    rowContent: {
        flex: 1,
    },
    rowTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 3,
    },
    name: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        color: theme.text,
        marginRight: 8,
    },
    nameUnread: {
        fontWeight: '700',
    },
    preview: {
        fontSize: 14,
        color: theme.textSecondary,
        lineHeight: 19,
    },
    previewUnread: {
        color: theme.text,
        fontWeight: '500',
    },
    unreadDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: theme.primary,
        flexShrink: 0,
    },

    // Error
    errorText: {
        color: theme.error,
        fontSize: 15,
        textAlign: 'center',
        marginBottom: 14,
    },
    retryBtn: {
        backgroundColor: theme.accent,
        paddingVertical: 10,
        paddingHorizontal: 28,
        borderRadius: 8,
    },
    retryBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },

    // Empty state
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        gap: 10,
    },
    emptyIcon: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: theme.accent + '22',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6,
    },
    emptyIconText: { fontSize: 30 },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.text,
        marginTop: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: theme.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
    startBtn: {
        marginTop: 6,
        backgroundColor: theme.primary,
        paddingHorizontal: 28,
        paddingVertical: 13,
        borderRadius: 24,
    },
    startBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },
});

export default MessagesListScreen;
