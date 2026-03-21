import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useRoute } from '@react-navigation/native';
import CustomButton from '../../components/CustomButton';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useTheme } from '../../src/theme';

const MessagesScreen = () => {
    const route = useRoute();
    const { client } = route.params;
    const { theme } = useTheme();

    const [messages, setMessages] = useState([
        { id: '1', text: 'Hey there! Excited for our next session?' },
        { id: '2', text: 'Yes! Can we focus on core workouts this time?' },
    ]);
    const [newMessage, setNewMessage] = useState('');

    const styles = makeStyles(theme);

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
        <ScreenWrapper title={`Messages with ${client.name}`}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={90}
            >
                <FlatList
                    data={messages}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.messagesList}
                    style={styles.flex}
                />

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Type your message..."
                        placeholderTextColor={theme.placeholder}
                        value={newMessage}
                        onChangeText={setNewMessage}
                    />
                    <CustomButton title="Send" onPress={handleSend} />
                </View>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
};

const makeStyles = (theme) => StyleSheet.create({
    flex: {
        flex: 1,
        backgroundColor: theme.background,
    },
    messagesList: {
        padding: 20,
        paddingBottom: 10,
    },
    messageBubble: {
        backgroundColor: theme.theirMessageBubble,
        padding: 12,
        borderRadius: 10,
        marginBottom: 10,
        alignSelf: 'flex-start',
        maxWidth: '80%',
    },
    messageText: {
        fontSize: 16,
        color: theme.text,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 10,
        borderTopWidth: 1,
        borderTopColor: theme.divider,
        backgroundColor: theme.card,
    },
    input: {
        flex: 1,
        backgroundColor: theme.inputBackground,
        padding: 12,
        borderRadius: 8,
        borderColor: theme.inputBorder,
        borderWidth: 1,
        fontSize: 16,
        color: theme.text,
    },
});

export default MessagesScreen;
