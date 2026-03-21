import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useHeaderHeight } from '@react-navigation/elements';
import CustomButton from '../../components/CustomButton';
import { fetchMessagesWithUser, sendMessage } from '../../src/api/message';
import { getUser } from '../../src/services/authService';
import { useTheme } from '../../src/theme';

const MessagesScreen = () => {
    const route = useRoute();
    const client = route.params?.client;
    const headerHeight = useHeaderHeight();
    const flatListRef = useRef(null);
    const { theme } = useTheme();

    const [userId, setUserId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [sendError, setSendError] = useState(null);

    useEffect(() => {
        const loadCurrentUser = async () => {
            const user = await getUser();
            if (user) setUserId(user.id);
        };
        loadCurrentUser();
    }, []);

    useEffect(() => {
        if (!client) return;
        const loadMessages = async () => {
            try {
                const response = await fetchMessagesWithUser(client.id);
                setMessages(response);
            } catch (error) {
                console.error('Failed to fetch messages:', error);
            }
        };
        loadMessages();
    }, [client]);

    const handleSend = async () => {
        if (!newMessage.trim() || !userId || !client) return;
        setSendError(null);

        const message = {
            sender_id: userId,
            receiver_id: client.id,
            trainer_id: userId,
            content: newMessage,
        };

        try {
            const response = await sendMessage(message);
            const newMsg = {
                id: response.message?.id || Date.now(),
                sender_id: userId,
                receiver_id: client.id,
                content: newMessage,
                created_at: new Date().toISOString(),
            };
            setMessages(prev => [...prev, newMsg]);
            setNewMessage('');
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        } catch (error) {
            console.error('Failed to send message:', error);
            setSendError('Message failed to send. Please try again.');
        }
    };

    const styles = makeStyles(theme);

    const renderItem = useCallback(({ item }) => (
        <View style={[
            styles.messageBubble,
            item.sender_id === userId ? styles.myMessage : styles.theirMessage,
        ]}>
            <Text style={[
                styles.messageText,
                { color: item.sender_id === userId ? theme.myMessageText : theme.theirMessageText },
            ]}>
                {item.content}
            </Text>
            <Text style={styles.timestamp}>
                {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
        </View>
    ), [userId, theme]);

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Messages</Text>
            <Text style={styles.emptySubtitle}>Send a message to start the conversation.</Text>
        </View>
    );

    const isSendDisabled = !newMessage.trim() || !userId;

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={headerHeight}
            >
                <Text style={styles.title}>
                    {client ? `${client.name}` : 'Messages'}
                </Text>

                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.messagesList}
                    style={{ flex: 1 }}
                    ListEmptyComponent={renderEmpty}
                    onContentSizeChange={() =>
                        flatListRef.current?.scrollToEnd({ animated: true })
                    }
                />

                {sendError ? (
                    <Text style={styles.errorText}>{sendError}</Text>
                ) : null}

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Type your message..."
                        placeholderTextColor={theme.placeholder}
                        value={newMessage}
                        onChangeText={text => {
                            setNewMessage(text);
                            if (sendError) setSendError(null);
                        }}
                        returnKeyType="send"
                        onSubmitEditing={handleSend}
                        blurOnSubmit={false}
                    />
                    <CustomButton
                        title="Send"
                        onPress={handleSend}
                        style={styles.sendButton}
                        disabled={isSendDisabled}
                    />
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
    container: {
        flex: 1,
        backgroundColor: theme.background,
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        color: theme.text,
    },
    messagesList: {
        paddingBottom: 12,
        flexGrow: 1,
    },
    messageBubble: {
        padding: 12,
        borderRadius: 14,
        marginBottom: 10,
        maxWidth: '80%',
    },
    myMessage: {
        backgroundColor: theme.myMessageBubble,
        alignSelf: 'flex-end',
        borderBottomRightRadius: 4,
    },
    theirMessage: {
        backgroundColor: theme.theirMessageBubble,
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 16,
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
        marginBottom: 6,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 10,
        paddingBottom: Platform.OS === 'ios' ? 10 : 20,
        borderTopWidth: 1,
        borderTopColor: theme.border,
    },
    input: {
        flex: 1,
        backgroundColor: theme.inputBackground,
        padding: 12,
        borderRadius: 22,
        borderColor: theme.inputBorder,
        borderWidth: 1,
        fontSize: 16,
        marginRight: 10,
        color: theme.text,
    },
    sendButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        marginTop: 0,
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
