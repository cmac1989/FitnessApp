import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { fetchConversations } from '../../src/api/message';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MessagesListScreen = () => {
    const navigation = useNavigation();
    const [conversations, setConversations] = useState([]);
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch user data from AsyncStorage
    const getUserInfo = async () => {
        try {
            const userData = await AsyncStorage.getItem('user');
            if (userData) {
                const parsedUserData = JSON.parse(userData);
                setUserInfo(parsedUserData);
            }
        } catch (err) {
            console.error('Error retrieving user data:', err);
        }
    };

    // Fetch conversations after user data is loaded
    const loadConversations = async () => {
        if (!userInfo) return;

        setLoading(true);

        try {
            const data = await fetchConversations();  // if your API accepts user ID, pass it here
            console.log('Fetched conversations:', data);

            const formatted = data.map(item => ({
                id: item.user.id,
                client: { name: item.user.name },
                lastMessage: item.last_message.content,
            }));

            setConversations(formatted);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch conversations:', err);
            setError('Failed to load conversations. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getUserInfo();
    }, []);

    useEffect(() => {
        if (userInfo) {
            loadConversations();
        }
    }, [userInfo]);

    const handleOpenChat = (clientId, clientName) => {
        navigation.navigate('Messages', { client: { id: clientId, name: clientName } });
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.messageItem}
            onPress={() => handleOpenChat(item.id, item.client.name)}
        >
            <Text style={styles.clientName}>{item.client.name}</Text>
            <Text style={styles.lastMessage}>{item.lastMessage}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Messages</Text>

            {loading ? (
                <Text>Loading...</Text>
            ) : error ? (
                <Text style={styles.errorText}>{error}</Text>
            ) : (
                <FlatList
                    data={conversations}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                />
            )}
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
    errorText: {
        color: 'red',
        fontSize: 16,
        marginTop: 20,
    },
});

export default MessagesListScreen;
