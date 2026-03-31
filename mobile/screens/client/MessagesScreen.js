import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, TextInput,
    KeyboardAvoidingView, Platform, TouchableOpacity,
    ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import {
    getClientMessagesWithUser, sendClientMessage,
    deleteClientMessage, toggleClientMessageLike,
} from '../../src/api/client';
import { getUser } from '../../src/services/authService';
import { useTheme } from '../../src/theme';
import { useToast } from '../../src/context/ToastContext';

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatTime = (iso) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const formatDateLabel = (iso) => {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'long', day: 'numeric' });
};

const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : parts[0].substring(0, 2).toUpperCase();
};

// ── Sub-components ────────────────────────────────────────────────────────────

const Avatar = ({ name, size = 34, color }) => (
    <View style={{
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: color, alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
    }}>
        <Text style={{ color: '#fff', fontSize: size * 0.38, fontWeight: '700' }}>
            {getInitials(name)}
        </Text>
    </View>
);

const DateSeparator = ({ iso, theme }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 20, paddingHorizontal: 4 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
        <Text style={{
            marginHorizontal: 12, fontSize: 11, color: theme.textMuted,
            fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5,
        }}>
            {formatDateLabel(iso)}
        </Text>
        <View style={{ flex: 1, height: 1, backgroundColor: theme.border }} />
    </View>
);

// ── Screen ────────────────────────────────────────────────────────────────────

const MessagesScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const trainer = route.params?.trainer;
    const { theme } = useTheme();
    const styles = makeStyles(theme);
    const { showToast } = useToast();
    const flatListRef = useRef(null);
    const insets = useSafeAreaInsets();

    // Hide the bottom tab bar while in a conversation
    useFocusEffect(
        useCallback(() => {
            const parent = navigation.getParent();
            parent?.setOptions({ tabBarStyle: { display: 'none' } });
            return () => parent?.setOptions({
                tabBarStyle: {
                    backgroundColor: theme.navBar,
                    borderTopColor: theme.navBarBorder,
                    borderTopWidth: 1,
                    paddingVertical: 5,
                    height: 70,
                },
            });
        }, [navigation, theme])
    );

    const [myId, setMyId]           = useState(null);
    const [messages, setMessages]   = useState([]);
    const [text, setText]           = useState('');
    const [sending, setSending]     = useState(false);
    const [loading, setLoading]     = useState(true);
    const [sendError, setSendError] = useState(null);

    useEffect(() => {
        getUser().then(u => { if (u?.id) setMyId(u.id); });
    }, []);

    useEffect(() => {
        if (!trainer?.id) return;
        let active = true;
        setLoading(true);
        getClientMessagesWithUser(trainer.id)
            .then(data => { if (active) setMessages(Array.isArray(data) ? data : []); })
            .catch(err => console.error('Failed to fetch messages:', err))
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [trainer?.id]);

    const scrollToEnd = () => {
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    };

    const handleSend = useCallback(async () => {
        const trimmed = text.trim();
        if (!trimmed || !trainer?.id || sending) return;
        setSendError(null);
        setSending(true);
        try {
            const res = await sendClientMessage(trainer.id, trimmed);
            const newMsg = res.message ?? {
                id: Date.now(),
                sender_id: myId,
                receiver_id: trainer.id,
                content: trimmed,
                is_deleted: false,
                like_count: 0,
                liked_by_me: false,
                created_at: new Date().toISOString(),
            };
            setMessages(prev => [...prev, newMsg]);
            setText('');
            scrollToEnd();
        } catch (err) {
            console.error('Failed to send message:', err);
            setSendError('Message failed to send. Please try again.');
        } finally {
            setSending(false);
        }
    }, [text, trainer, sending, myId]);

    const handleLike = useCallback(async (messageId) => {
        setMessages(prev => prev.map(m => {
            if (m.id !== messageId) return m;
            const wasLiked = m.liked_by_me;
            return { ...m, liked_by_me: !wasLiked, like_count: wasLiked ? m.like_count - 1 : m.like_count + 1 };
        }));
        try {
            const res = await toggleClientMessageLike(messageId);
            setMessages(prev => prev.map(m =>
                m.id === messageId ? { ...m, liked_by_me: res.liked, like_count: res.like_count } : m
            ));
        } catch {
            setMessages(prev => prev.map(m => {
                if (m.id !== messageId) return m;
                const wasLiked = m.liked_by_me;
                return { ...m, liked_by_me: !wasLiked, like_count: wasLiked ? m.like_count - 1 : m.like_count + 1 };
            }));
        }
    }, []);

    const handleDelete = useCallback((messageId) => {
        Alert.alert(
            'Delete Message',
            'This message will be deleted for everyone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteClientMessage(messageId);
                            setMessages(prev => prev.map(m =>
                                m.id === messageId ? { ...m, is_deleted: true, content: null } : m
                            ));
                        } catch {
                            showToast('Could not delete message.', 'error');
                        }
                    },
                },
            ]
        );
    }, []);

    const handleLongPress = useCallback((item) => {
        if (item.is_deleted) return;
        const isMine = item.sender_id === myId;
        const likeLabel = item.liked_by_me ? 'Unlike' : 'Like';
        const options = [
            { text: likeLabel, onPress: () => handleLike(item.id) },
        ];
        if (isMine) {
            options.push({ text: 'Delete', style: 'destructive', onPress: () => handleDelete(item.id) });
        }
        options.push({ text: 'Cancel', style: 'cancel' });
        Alert.alert('', '', options);
    }, [myId, handleLike, handleDelete]);

    const renderItem = useCallback(({ item, index }) => {
        const isMine = item.sender_id === myId;
        const hasReaction = item.like_count > 0;
        const showDate = index === 0 ||
            new Date(messages[index - 1].created_at).toDateString() !== new Date(item.created_at).toDateString();

        return (
            <>
                {showDate && <DateSeparator iso={item.created_at} theme={theme} />}
                <TouchableOpacity
                    onLongPress={() => handleLongPress(item)}
                    delayLongPress={350}
                    activeOpacity={0.85}
                >
                    <View style={[styles.row, isMine ? styles.rowMine : styles.rowTheirs]}>
                        {!isMine && (
                            <Avatar name={trainer?.name} size={30} color={theme.accent} />
                        )}
                        <View style={[styles.bubbleWrap, isMine ? styles.bubbleWrapMine : styles.bubbleWrapTheirs]}>
                            <View style={[styles.bubble, isMine ? styles.myBubble : styles.theirBubble]}>
                                {item.is_deleted ? (
                                    <Text style={styles.deletedText}>Message deleted</Text>
                                ) : (
                                    <Text style={[styles.bubbleText, { color: isMine ? theme.myMessageText : theme.theirMessageText }]}>
                                        {item.content}
                                    </Text>
                                )}
                                <Text style={[styles.timestamp, isMine ? styles.timestampMine : null]}>
                                    {formatTime(item.created_at)}
                                </Text>
                            </View>
                            {hasReaction && (
                                <View style={[styles.reactionBadge, isMine ? styles.reactionBadgeMine : styles.reactionBadgeTheirs]}>
                                    <Text style={[styles.reactionText, item.liked_by_me && styles.reactionTextLiked]}>
                                        {'\u2665'}{item.like_count > 1 ? ` ${item.like_count}` : ''}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                </TouchableOpacity>
            </>
        );
    }, [myId, theme, styles, handleLongPress, messages, trainer]);

    const renderEmpty = () => {
        if (loading) return null;
        return (
            <View style={styles.emptyContainer}>
                <View style={styles.emptyAvatar}>
                    <Text style={styles.emptyAvatarText}>{getInitials(trainer?.name)}</Text>
                </View>
                <Text style={styles.emptyTitle}>{trainer?.name ?? 'Trainer'}</Text>
                <Text style={styles.emptySubtitle}>Send a message to start the conversation.</Text>
            </View>
        );
    };

    return (
        <View style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
            >
                {/* Conversation header — extends into status bar */}
                <View style={[styles.convHeader, { paddingTop: insets.top + 10 }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
                        <Text style={styles.backBtnText}>‹</Text>
                    </TouchableOpacity>
                    <Avatar name={trainer?.name} size={38} color={theme.accent} />
                    <View style={styles.convHeaderInfo}>
                        <Text style={styles.convHeaderName} numberOfLines={1}>{trainer?.name ?? 'Trainer'}</Text>
                    </View>
                </View>
                {loading ? (
                    <ActivityIndicator size="large" color={theme.accent} style={styles.loader} />
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={item => item.id.toString()}
                        renderItem={renderItem}
                        contentContainerStyle={styles.list}
                        style={styles.flex}
                        ListEmptyComponent={renderEmpty}
                        onContentSizeChange={scrollToEnd}
                        onLayout={scrollToEnd}
                    />
                )}

                {sendError ? <Text style={styles.errorText}>{sendError}</Text> : null}

                <View style={[styles.inputRow, { paddingBottom: insets.bottom + (Platform.OS === 'ios' ? 2 : 2) }]}>
                    <TextInput
                        style={styles.input}
                        placeholder="Message..."
                        placeholderTextColor={theme.placeholder}
                        value={text}
                        onChangeText={t => { setText(t); if (sendError) setSendError(null); }}
                        returnKeyType="send"
                        onSubmitEditing={handleSend}
                        blurOnSubmit={false}
                        color={theme.text}
                        editable={!sending}
                        multiline
                    />
                    <TouchableOpacity
                        style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
                        onPress={handleSend}
                        disabled={!text.trim() || sending}
                        activeOpacity={0.8}
                    >
                        {sending
                            ? <ActivityIndicator color="#fff" size="small" />
                            : <Text style={styles.sendBtnText}>↑</Text>
                        }
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const makeStyles = (theme) => StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: theme.background,
    },
    flex: { flex: 1 },
    loader: {
        flex: 1,
        marginTop: 60,
    },

    // Conversation header
    convHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingBottom: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.border,
        backgroundColor: theme.card,
        gap: 10,
    },
    convHeaderInfo: { flex: 1 },
    backBtn: {
        paddingHorizontal: 4,
        paddingVertical: 2,
    },
    backBtnText: {
        fontSize: 32,
        color: theme.primary,
        lineHeight: 36,
        fontWeight: '300',
    },
    convHeaderName: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.text,
    },

    // List
    list: {
        paddingHorizontal: 12,
        paddingTop: 8,
        paddingBottom: 12,
        flexGrow: 1,
    },

    // Message row (outer flex container for avatar + bubble)
    row: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 4,
        gap: 8,
    },
    rowMine: {
        justifyContent: 'flex-end',
    },
    rowTheirs: {
        justifyContent: 'flex-start',
    },

    // Bubble wrapper (relative for reaction badge positioning)
    bubbleWrap: {
        maxWidth: '75%',
        position: 'relative',
        marginBottom: 10,
    },
    bubbleWrapMine: {},
    bubbleWrapTheirs: {},

    bubble: {
        paddingHorizontal: 14,
        paddingTop: 10,
        paddingBottom: 8,
        borderRadius: 20,
    },
    myBubble: {
        backgroundColor: theme.myMessageBubble,
        borderBottomRightRadius: 4,
    },
    theirBubble: {
        backgroundColor: theme.theirMessageBubble,
        borderBottomLeftRadius: 4,
    },
    bubbleText: {
        fontSize: 16,
        lineHeight: 22,
    },
    deletedText: {
        fontSize: 14,
        color: theme.textMuted,
        fontStyle: 'italic',
    },
    timestamp: {
        fontSize: 11,
        color: theme.textMuted,
        marginTop: 3,
        alignSelf: 'flex-end',
    },
    timestampMine: {
        color: theme.myMessageText ? theme.myMessageText + '88' : theme.textMuted,
    },

    // Reaction badge
    reactionBadge: {
        position: 'absolute',
        bottom: -8,
        backgroundColor: theme.card,
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderWidth: 1,
        borderColor: theme.border,
        flexDirection: 'row',
        alignItems: 'center',
    },
    reactionBadgeMine: { right: 8 },
    reactionBadgeTheirs: { left: 8 },
    reactionText: { fontSize: 12, color: theme.textMuted },
    reactionTextLiked: { color: '#ef4444' },

    // Error
    errorText: {
        color: theme.error,
        fontSize: 13,
        textAlign: 'center',
        paddingHorizontal: 16,
        paddingBottom: 4,
    },

    // Input row
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 12,
        paddingTop: 8,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: theme.border,
        backgroundColor: theme.card,
        gap: 8,
    },
    input: {
        flex: 1,
        backgroundColor: theme.inputBackground,
        borderRadius: 22,
        borderColor: theme.inputBorder,
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: Platform.OS === 'ios' ? 10 : 8,
        fontSize: 16,
        color: theme.text,
        maxHeight: 120,
    },
    sendBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.primary,
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
    },
    sendBtnDisabled: { opacity: 0.4 },
    sendBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 20,
        lineHeight: 24,
    },

    // Empty state
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 30,
    },
    emptyAvatar: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: theme.accent + '33',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    emptyAvatarText: {
        fontSize: 26,
        fontWeight: '700',
        color: theme.accent,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.text,
        marginBottom: 6,
    },
    emptySubtitle: {
        fontSize: 14,
        color: theme.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default MessagesScreen;
