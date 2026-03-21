import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useHeaderHeight } from '@react-navigation/elements';
import CustomButton from '../../components/CustomButton';
import { fetchMessagesWithUser, sendMessage } from '../../src/api/message';
import { getUser } from '../../src/services/authService';

const MessagesScreen = () => {
    const route = useRoute();
    const client = route.params?.client;
    const headerHeight = useHeaderHeight();
    const flatListRef = useRef(null);

    const [userId, setUserId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [sendError, setSendError] = useState(null);

    useEffect(() => {
        const loadCurrentUser = async () => {
            const user = await getUser();
            if (user) {
                setUserId(user.id);
            }
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
            setSendError('Message failed to send. Tap to retry.');
        }
    };

    const renderItem = useCallback(({ item }) => (
        <View
            style={[
                styles.messageBubble,
                item.sender_id === userId ? styles.myMessage : styles.theirMessage,
            ]}
        >
            <Text style={styles.messageText}>{item.content}</Text>
            <Text style={styles.timestamp}>
                {new Date(item.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                })}
            </Text>
        </View>
    ), [userId]);

    const isSendDisabled = !newMessage.trim() || !userId;

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={headerHeight}
        >
            <Text style={styles.title}>
                Messages {client ? `with ${client.name}` : ''}
            </Text>

            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={item => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.messagesList}
                style={{ flex: 1 }}
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
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f8f8',
        padding: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    messagesList: {
        paddingBottom: 20,
    },
    messageBubble: {
        padding: 12,
        borderRadius: 10,
        marginBottom: 10,
        maxWidth: '80%',
    },
    myMessage: {
        backgroundColor: '#cfe9ff',
        alignSelf: 'flex-end',
    },
    theirMessage: {
        backgroundColor: '#e0e0e0',
        alignSelf: 'flex-start',
    },
    messageText: {
        fontSize: 16,
    },
    timestamp: {
        fontSize: 12,
        color: '#555',
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    errorText: {
        color: '#cc0000',
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 6,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 10,
        paddingBottom: 40,
        borderColor: '#ddd',
    },
    input: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        borderColor: '#ddd',
        borderWidth: 1,
        fontSize: 16,
        marginRight: 10,
        marginTop: 10,
    },
    sendButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        backgroundColor: '#6200EE',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default MessagesScreen;
