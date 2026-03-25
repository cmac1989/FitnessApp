import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, ActivityIndicator,
    TouchableOpacity, RefreshControl, Modal, Pressable, Platform,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import ScreenWrapper from '../components/ScreenWrapper';
import { fetchConversations, markMessageAsRead } from '../src/api/message';
import { getClientConversations, markClientMessagesAsRead } from '../src/api/client';
import { getClients } from '../src/api/user';
import { useTheme } from '../src/theme';

// ── Helpers ───────────────────────────────────────────────────────────────────

const AVATAR_COLORS = ['#6366f1', '#f43f5e', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

const avatarColor = (name = '') => {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
};

const getInitials = (name = '') => {
    const parts = name.trim().split(' ');
    return parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : name.substring(0, 2).toUpperCase();
};

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

// ── Avatar ────────────────────────────────────────────────────────────────────

const Avatar = ({ name, size = 46 }) => (
    <View style={[
        avatarStyles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: avatarColor(name) },
    ]}>
        <Text style={[avatarStyles.initials, { fontSize: size * 0.36 }]}>{getInitials(name)}</Text>
    </View>
);

const avatarStyles = StyleSheet.create({
    circle:   { alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    initials: { color: '#fff', fontWeight: '700' },
});

// ── Conversation card ─────────────────────────────────────────────────────────

const ConvoCard = ({ item, onPress, theme, styles }) => {
    const isUnread = !item.readAt && !item.isMine;
    const preview  = item.isDeleted
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

            <Avatar name={item.contactName} size={46} />

            <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                    <Text
                        style={[styles.cardName, isUnread && styles.cardNameUnread]}
                        numberOfLines={1}
                    >
                        {item.contactName}
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

const AllMessagesScreen = () => {
    const navigation = useNavigation();
    const route      = useRoute();
    const { theme }  = useTheme();
    const styles     = makeStyles(theme);

    const role = route.params?.role ?? 'trainer';

    const fetchFn = role === 'client' ? getClientConversations : fetchConversations;
    const markFn  = role === 'client' ? markClientMessagesAsRead : markMessageAsRead;

    const [conversations, setConversations]   = useState([]);
    const [loading, setLoading]               = useState(true);
    const [refreshing, setRefreshing]         = useState(false);
    const [totalCount, setTotalCount]         = useState(0);
    const [unreadCount, setUnreadCount]       = useState(0);

    // Trainer compose modal
    const [showModal, setShowModal]           = useState(false);
    const [clients, setClients]               = useState([]);
    const [clientsLoading, setClientsLoading] = useState(false);

    const format = (data) => data.map(item => ({
        id:          item.user.id,
        contactId:   item.user.id,
        contactName: item.user.name,
        lastMessage: item.last_message.content,
        isDeleted:   item.last_message.is_deleted,
        isMine:      item.last_message.is_mine,
        readAt:      item.last_message.read_at,
        createdAt:   item.last_message.created_at,
    }));

    const load = useCallback(async (opts = {}) => {
        if (opts.refresh) setRefreshing(true);
        else setLoading(true);
        try {
            const data = await fetchFn();
            const list = format(Array.isArray(data) ? data : []);
            setConversations(list);
            setTotalCount(list.length);
            setUnreadCount(list.filter(c => !c.readAt && !c.isMine).length);
        } catch {}
        finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [fetchFn]);

    useFocusEffect(
        useCallback(() => {
            load();
            markFn().catch(() => {});
        }, [load, markFn])
    );

    const openConversation = (item) => {
        if (role === 'client') {
            navigation.navigate('ClientMessages', { trainer: { id: item.contactId, name: item.contactName } });
        } else {
            navigation.navigate('Messages', { client: { id: item.contactId, name: item.contactName } });
        }
    };

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

    if (loading) {
        return (
            <ScreenWrapper title="All Messages" showBack>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={theme.accent} />
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper title="All Messages" showBack>
            <View style={styles.container}>

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <View>
                            <Text style={styles.title}>Messages</Text>
                            {totalCount > 0 && (
                                <Text style={styles.subtitle}>
                                    {totalCount} conversation{totalCount !== 1 ? 's' : ''}
                                    {unreadCount > 0 ? `  ·  ${unreadCount} unread` : ''}
                                </Text>
                            )}
                        </View>
                        {unreadCount > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{unreadCount}</Text>
                            </View>
                        )}
                    </View>

                    {role === 'trainer' && (
                        <TouchableOpacity
                            style={styles.composeBtn}
                            onPress={openNewConversation}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.composeBtnText}>+ New</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {conversations.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIcon}>
                            <Text style={styles.emptyIconText}>✉</Text>
                        </View>
                        <Text style={styles.emptyTitle}>No Conversations</Text>
                        <Text style={styles.emptySubtitle}>
                            {role === 'trainer'
                                ? 'Start a conversation with one of your clients.'
                                : 'Messages from your trainer will appear here.'}
                        </Text>
                        {role === 'trainer' && (
                            <TouchableOpacity
                                style={styles.startBtn}
                                onPress={openNewConversation}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.startBtnText}>Start a Conversation</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    <FlatList
                        data={conversations}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => (
                            <ConvoCard
                                item={item}
                                theme={theme}
                                styles={styles}
                                onPress={() => openConversation(item)}
                            />
                        )}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={() => load({ refresh: true })}
                                tintColor={theme.accent}
                                colors={[theme.accent]}
                            />
                        }
                    />
                )}
            </View>

            {/* Trainer compose modal */}
            {role === 'trainer' && (
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
            )}
        </ScreenWrapper>
    );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const makeStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.background,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
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
    subtitle: {
        fontSize: 13,
        color: theme.textMuted,
        marginTop: 2,
    },
    badge: {
        backgroundColor: theme.accent,
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
        minWidth: 28,
        alignItems: 'center',
        alignSelf: 'flex-start',
        marginTop: 2,
    },
    badgeText: {
        color: '#fff',
        fontSize: 13,
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

    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 40,
    },

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
        backgroundColor: theme.accent + '20',
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyIconText: { fontSize: 30 },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.text,
        marginTop: 6,
    },
    emptySubtitle: {
        fontSize: 14,
        color: theme.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
    startBtn: {
        marginTop: 8,
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

export default AllMessagesScreen;
