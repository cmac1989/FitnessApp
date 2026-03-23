import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, Modal, Pressable, Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { fetchConversations, markMessageAsRead } from '../../src/api/message';
import { getClients } from '../../src/api/user';
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
    const [loading, setLoading]             = useState(true);
    const [error, setError]                 = useState(null);
    const [showModal, setShowModal]         = useState(false);
    const [clients, setClients]             = useState([]);
    const [clientsLoading, setClientsLoading] = useState(false);

    const loadConversations = useCallback(async (cancelled) => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchConversations();
            if (cancelled?.value) return;
            const formatted = data.map(item => ({
                id:          item.user.id,
                name:        item.user.name,
                lastMessage: item.last_message.content,
                isDeleted:   item.last_message.is_deleted,
                isMine:      item.last_message.is_mine,
                readAt:      item.last_message.read_at,
            }));
            setConversations(formatted);
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
            markMessageAsRead().catch(() => {});
            return () => { cancelled.value = true; };
        }, [loadConversations])
    );

    const openNewConversation = async () => {
        setShowModal(true);
        setClientsLoading(true);
        try {
            const data = await getClients();
            setClients(data);
        } catch {
            setClients([]);
        } finally {
            setClientsLoading(false);
        }
    };

    const startConversation = (client) => {
        setShowModal(false);
        navigation.navigate('Messages', { client: { id: client.id, name: client.name } });
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
                onPress={() => navigation.navigate('Messages', { client: { id: item.id, name: item.name } })}
                activeOpacity={0.7}
            >
                <Avatar name={item.name} size={48} />

                <View style={styles.rowContent}>
                    <View style={styles.rowTop}>
                        <Text style={[styles.name, isUnread && styles.nameUnread]} numberOfLines={1}>
                            {item.name}
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
            <View style={styles.emptyIcon}>
                <Text style={styles.emptyIconText}>✉</Text>
            </View>
            <Text style={styles.emptyTitle}>No Conversations</Text>
            <Text style={styles.emptySubtitle}>
                Start a conversation by tapping the button above.
            </Text>
        </View>
    );

    return (
        <ScreenWrapper title="Messages" showBack>
            {/* Subheader with compose button */}
            <View style={styles.subHeader}>
                <Text style={styles.subHeaderTitle}>Messages</Text>
                <TouchableOpacity style={styles.composeBtn} onPress={openNewConversation} activeOpacity={0.8}>
                    <Text style={styles.composeBtnText}>+ New</Text>
                </TouchableOpacity>
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

            {/* Client picker modal */}
            <Modal
                visible={showModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowModal(false)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setShowModal(false)}>
                    <Pressable style={[styles.modalSheet, { backgroundColor: theme.card }]} onPress={() => {}}>
                        <View style={styles.modalHandle} />
                        <Text style={styles.modalTitle}>Start a Conversation</Text>

                        {clientsLoading ? (
                            <ActivityIndicator size="large" color={theme.accent} style={{ marginVertical: 32 }} />
                        ) : clients.length === 0 ? (
                            <Text style={styles.modalEmpty}>No clients linked yet.</Text>
                        ) : (
                            <FlatList
                                data={clients}
                                keyExtractor={(item) => item.id.toString()}
                                renderItem={({ item, index }) => (
                                    <TouchableOpacity
                                        style={[styles.clientRow, index < clients.length - 1 && styles.clientRowBorder]}
                                        onPress={() => startConversation(item)}
                                        activeOpacity={0.65}
                                    >
                                        <Avatar name={item.name} size={38} />
                                        <Text style={styles.clientRowName}>{item.name}</Text>
                                    </TouchableOpacity>
                                )}
                            />
                        )}

                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>
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

    // Error / Empty
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

    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    emptyIcon: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: theme.accent + '22',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyIconText: { fontSize: 30 },
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

    // Client picker modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'flex-end',
    },
    modalSheet: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 36 : 20,
        maxHeight: '65%',
    },
    modalHandle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: theme.border,
        alignSelf: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: theme.text,
        marginBottom: 12,
    },
    modalEmpty: {
        fontSize: 15,
        color: theme.textSecondary,
        textAlign: 'center',
        marginVertical: 24,
    },
    clientRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 12,
    },
    clientRowBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.border,
    },
    clientRowName: {
        fontSize: 16,
        color: theme.text,
        fontWeight: '500',
    },
    cancelBtn: {
        marginTop: 8,
        paddingVertical: 14,
        alignItems: 'center',
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: theme.border,
    },
    cancelBtnText: {
        fontSize: 16,
        color: theme.error,
        fontWeight: '600',
    },
});

export default MessagesListScreen;
