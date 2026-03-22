import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, TextInput,
    KeyboardAvoidingView, Platform, SafeAreaView, TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { getClientMessagesWithUser, sendClientMessage } from '../../src/api/client';
import { getUser } from '../../src/services/authService';
import { useTheme } from '../../src/theme';

const MessagesScreen = () => {
    const route = useRoute();
    const trainer = route.params?.trainer;
    const { theme } = useTheme();
    const styles = makeStyles(theme);
    const flatListRef = useRef(null);

    const [myId, setMyId]         = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText]         = useState('');
    const [sending, setSending]   = useState(false);
    const [loading, setLoading]   = useState(true);
    const [sendError, setSendError] = useState(null);

    // Load current user id once
    useEffect(() => {
        getUser().then(u => { if (u?.id) setMyId(u.id); });
    }, []);

    // Load messages when trainer is available
    useEffect(() => {
        if (!trainer?.id) return;
        let active = true;
        setLoading(true);
        getClientMessagesWithUser(trainer.id)
            .then(data => { if (active) setMessages(data); })
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

    const renderItem = useCallback(({ item }) => {
        const isMine = item.sender_id === myId;
        return (
            <View style={[styles.bubble, isMine ? styles.myBubble : styles.theirBubble]}>
                <Text style={[styles.bubbleText, { color: isMine ? theme.myMessageText : theme.theirMessageText }]}>
                    {item.content}
                </Text>
                <Text style={styles.timestamp}>
                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
        );
    }, [myId, theme, styles]);

    const renderEmpty = () => {
        if (loading) return null;
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>No Messages</Text>
                <Text style={styles.emptySubtitle}>Send a message to start the conversation.</Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
            >
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

                <View style={styles.inputRow}>
                    <TextInput
                        style={styles.input}
                        placeholder="Type a message…"
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
                        <Text style={styles.sendBtnText}>Send</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

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
    list: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
        flexGrow: 1,
    },
    bubble: {
        padding: 12,
        borderRadius: 18,
        marginBottom: 8,
        maxWidth: '80%',
    },
    myBubble: {
        backgroundColor: theme.myMessageBubble,
        alignSelf: 'flex-end',
        borderBottomRightRadius: 4,
    },
    theirBubble: {
        backgroundColor: theme.theirMessageBubble,
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 4,
    },
    bubbleText: {
        fontSize: 16,
        lineHeight: 22,
    },
    timestamp: {
        fontSize: 11,
        color: theme.textMuted,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    errorText: {
        color: theme.error,
        fontSize: 13,
        textAlign: 'center',
        paddingHorizontal: 16,
        paddingBottom: 4,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 12,
        paddingTop: 8,
        paddingBottom: Platform.OS === 'ios' ? 12 : 16,
        borderTopWidth: 1,
        borderTopColor: theme.border,
        backgroundColor: theme.background,
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
        marginRight: 10,
        maxHeight: 120,
    },
    sendBtn: {
        backgroundColor: theme.primary,
        borderRadius: 22,
        paddingHorizontal: 20,
        paddingVertical: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendBtnDisabled: {
        opacity: 0.45,
    },
    sendBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
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
    },
});

export default MessagesScreen;
