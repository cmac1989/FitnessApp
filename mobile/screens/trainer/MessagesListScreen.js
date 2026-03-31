import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, Modal, Pressable, Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import Avatar from '../../components/Avatar';
import { fetchConversations, markMessageAsRead } from '../../src/api/message';
import { getClients } from '../../src/api/user';
import { useTheme } from '../../src/theme';

// ── Constants ─────────────────────────────────────────────────────────────────

const PREVIEW_LIMIT = 10;

// ── Helpers ───────────────────────────────────────────────────────────────────

const timeAgo = (dateString) => {
    if (!dateString) return '';
    const diff = Date.now() - new Date(dateString).getTime();
    const mins  = Math.floor(diff / 60000);
    if (mins < 1)  return 'just now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return 'Yesterday';
    if (days < 7)  return new Date(dateString).toLocaleDateString('en-US', { weekday: 'short' });
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ── Conversation card ─────────────────────────────────────────────────────────

const ConvoCard = ({ item, onPress, theme, styles }) => {
    const isUnread  = !item.readAt && !item.isMine;
    const preview   = item.isDeleted
        ? (item.isMine ? 'You deleted a message' : 'Message deleted')
        : item.isMine
            ? `You: ${item.lastMessage ?? ''}`
            : (item.lastMessage ?? '');

    return (
        <TouchableOpacity
            style={[styles.card, isUnread && styles.cardUnread]}
            onPress={onPress}
            activeOpacity={0.72}
        >
            {isUnread && <View style={styles.unreadBar} />}

            <Avatar name={item.name} photoUri={item.photoUri} size={46} />

            <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                    <Text
                        style={[styles.cardName, isUnread && styles.cardNameUnread]}
                        numberOfLines={1}
                    >
                        {item.name}
                    </Text>
                    <Text style={styles.cardTime}>{timeAgo(item.createdAt)}</Text>
                </View>
                <Text
                    style={[styles.cardPreview, isUnread && styles.cardPreviewUnread]}
                    numberOfLines={1}
                >
                    {preview}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

// ── Screen ────────────────────────────────────────────────────────────────────

const MessagesListScreen = () => {
    const navigation = useNavigation();
    const { theme }  = useTheme();
    const styles     = makeStyles(theme);

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
            setConversations(data.map(item => ({
                id:          item.user.id,
                name:        item.user.name,
                photoUri:    item.user.profile_picture ?? null,
                lastMessage: item.last_message.content,
                isDeleted:   item.last_message.is_deleted,
                isMine:      item.last_message.is_mine,
                readAt:      item.last_message.read_at,
                createdAt:   item.last_message.created_at,
            })));
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

    const preview       = conversations.slice(0, PREVIEW_LIMIT);
    const unreadCount   = conversations.filter(c => !c.readAt && !c.isMine).length;

    const ListFooter = () => {
        if (conversations.length <= PREVIEW_LIMIT) return null;
        return (
            <TouchableOpacity
                style={styles.seeAllBtn}
                onPress={() => navigation.navigate('AllMessages', { role: 'trainer' })}
                activeOpacity={0.75}
            >
                <Text style={styles.seeAllText}>
                    See all {conversations.length} conversations
                </Text>
                <Text style={styles.seeAllChevron}>›</Text>
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
                Start a conversation by tapping "+ New" above.
            </Text>
        </View>
    );

    return (
        <ScreenWrapper title="Messages" showBack>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.title}>Messages</Text>
                    {unreadCount > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{unreadCount}</Text>
                        </View>
                    )}
                </View>
                <TouchableOpacity style={styles.composeBtn} onPress={openNewConversation} activeOpacity={0.8}>
                    <Text style={styles.composeBtnText}>+ New</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={theme.accent} />
                </View>
            ) : error ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={() => loadConversations({})}>
                        <Text style={styles.retryBtnText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={preview}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <ConvoCard
                            item={item}
                            theme={theme}
                            styles={styles}
                            onPress={() => navigation.navigate('Messages', { client: { id: item.id, name: item.name } })}
                        />
                    )}
                    contentContainerStyle={[styles.list, preview.length === 0 && styles.listEmpty]}
                    ListEmptyComponent={renderEmpty}
                    ListFooterComponent={<ListFooter />}
                    showsVerticalScrollIndicator={false}
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
                                        <Avatar name={item.name} photoUri={item.profile_picture ?? null} size={38} />
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
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 14,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: theme.text,
    },
    badge: {
        backgroundColor: theme.accent,
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 2,
        minWidth: 22,
        alignItems: 'center',
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
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

    list:      { paddingHorizontal: 16, paddingBottom: 16 },
    listEmpty: { flexGrow: 1 },

    // Card
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
        overflow: 'hidden',
    },
    cardUnread: {
        backgroundColor: theme.accent + '08',
        borderColor: theme.accent + '30',
    },
    unreadBar: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 3,
        backgroundColor: theme.accent,
        borderTopLeftRadius: 14,
        borderBottomLeftRadius: 14,
    },
    cardBody: {
        flex: 1,
    },
    cardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 3,
        gap: 8,
    },
    cardName: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
        color: theme.text,
    },
    cardNameUnread: {
        fontWeight: '700',
    },
    cardTime: {
        fontSize: 12,
        color: theme.textMuted,
        flexShrink: 0,
    },
    cardPreview: {
        fontSize: 13,
        color: theme.textSecondary,
        lineHeight: 18,
    },
    cardPreviewUnread: {
        color: theme.text,
        fontWeight: '500',
    },

    // See all footer
    seeAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.card,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.border,
        paddingVertical: 14,
        paddingHorizontal: 20,
        marginTop: 4,
        marginHorizontal: 16,
        marginBottom: 16,
        gap: 4,
    },
    seeAllText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.primary,
    },
    seeAllChevron: {
        fontSize: 18,
        color: theme.primary,
        fontWeight: '300',
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

    // Modal
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
