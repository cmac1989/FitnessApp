import React, { useState } from 'react';
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
import CustomButton from '../../components/CustomButton';

const MessagesScreen = () => {
    const route = useRoute();
    const client = route.params?.client;

    const [messages, setMessages] = useState([
        { id: '1', text: 'Hey there! Excited for our next session?' },
        { id: '2', text: 'Yes! Can we focus on core workouts this time?' },
    ]);
    const [newMessage, setNewMessage] = useState('');

    const handleSend = () => {
        if (newMessage.trim() === '') return;

        const newMsg = { id: Date.now().toString(), text: newMessage };
        setMessages(prev => [...prev, newMsg]);
        setNewMessage('');
    };

    const renderItem = ({ item }) => (
        <View style={styles.messageBubble}>
            <Text style={styles.messageText}>{item.text}</Text>
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
                data={messages}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.messagesList}
            />

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Type your message..."
                    value={newMessage}
                    onChangeText={setNewMessage}
                />
                <CustomButton title="Send" onPress={handleSend} />
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
        backgroundColor: '#e0e0e0',
        padding: 12,
        borderRadius: 10,
        marginBottom: 10,
        alignSelf: 'flex-start',
        maxWidth: '80%',
    },
    messageText: {
        fontSize: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        gap: 10,
    },
    input: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        borderColor: '#ddd',
        borderWidth: 1,
        fontSize: 16,
    },
});

export default MessagesScreen;
