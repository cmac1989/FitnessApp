import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useRoute } from '@react-navigation/native';
import CustomButton from '../../components/CustomButton';
import { fetchMessagesWithUser, sendMessage } from '../../src/api/message';

const MessagesScreen = () => {
    const route = useRoute();
    const client = route.params?.client;
    const userId = 4; // TODO: replace with AsyncStorage or state later
    const flatListRef = useRef(null);

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');

    // Fetch messages when component mounts or client changes
    useEffect(() => {
        if (client) {
            const loadMessages = async () => {
                try {
                    const response = await fetchMessagesWithUser(client.id);
                    setMessages(response);
                } catch (error) {
                    console.error('Failed to fetch messages:', error);
                }
            };
            loadMessages();
        }
    }, [client]);

    // Send a new message
    const handleSend = async () => {
        if (newMessage.trim() === '') return;

        const message = {
            sender_id: userId,
            receiver_id: client.id,
            trainer_id: userId, // assuming sender is always the trainer
            content: newMessage,
            scheduled_at: null,
        };

        try {
            const response = await sendMessage(message);

            // Append new message from response or create a local fallback message
            const newMsg = {
                id: response.message?.id || new Date().getTime(),
                sender_id: userId,
                receiver_id: client.id,
                content: newMessage,
                created_at: new Date(),
            };

            setMessages(prev => [...prev, newMsg]);
            setNewMessage('');

            // Scroll to bottom
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    const renderItem = ({ item }) => (
        <View
            style={[
                styles.messageBubble,
                item.sender_id === userId ? styles.myMessage : styles.theirMessage,
            ]}
        >
            <Text style={styles.messageText}>{item.content}</Text>
            <Text style={styles.timestamp}>
                {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
        </View>
    );

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={90}
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
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Type your message..."
                    value={newMessage}
                    onChangeText={setNewMessage}
                />
                <CustomButton
                    title="Send"
                    onPress={handleSend}
                    style={styles.sendButton}
                    disabled={newMessage.trim() === ''}
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
