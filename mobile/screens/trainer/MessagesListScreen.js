import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const dummyConversations = [
    {
        id: '1',
        client: { name: 'Jordan Smith' },
        lastMessage: 'Can we do HIIT next session?',
    },
    {
        id: '2',
        client: { name: 'Alex Lee' },
        lastMessage: 'Awesome session today — thanks!',
    },
    {
        id: '3',
        client: { name: 'Taylor Kim' },
        lastMessage: 'What time is our next workout?',
    },
];

const MessagesListScreen = () => {
    const navigation = useNavigation();

    const handleOpenChat = (client) => {
        navigation.navigate('MessagesScreen', { client });
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.messageItem}
            onPress={() => handleOpenChat(item.client)}
        >
            <Text style={styles.clientName}>{item.client.name}</Text>
            <Text style={styles.lastMessage}>{item.lastMessage}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Messages</Text>

            <FlatList
                data={dummyConversations}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f8f8',
        padding: 20,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    listContent: {
        paddingBottom: 20,
    },
    messageItem: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 10,
        marginBottom: 12,
        borderColor: '#ddd',
        borderWidth: 1,
    },
    clientName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    lastMessage: {
        fontSize: 14,
        color: '#555',
        marginTop: 4,
    },
});

export default MessagesListScreen;
