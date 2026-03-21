import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useTheme } from '../../src/theme';

const ClientsListScreen = () => {
    const navigation = useNavigation();
    const { theme } = useTheme();
    const [clients, setClients] = useState([]);

    useEffect(() => {
        const fetchClients = async () => {
            const mockClients = [
                { id: 1, name: 'Sarah Connor', age: 32, gender: 'female', goals: 'lose weight', medicalConditions: 'none' },
                { id: 2, name: 'John Connor', age: 32, gender: 'male', goals: 'lose weight', medicalConditions: 'none' },
                { id: 3, name: 'Emily Carter', age: 32, gender: 'female', goals: 'lose weight', medicalConditions: 'none' },
            ];
            setClients(mockClients);
        };
        fetchClients();
    }, []);

    const styles = makeStyles(theme);

    const renderClient = ({ item }) => (
        <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            onPress={() => navigation.navigate('ClientDetails', { clients: item })}
        >
            <Text style={styles.clientName}>{item.name}</Text>
        </Pressable>
    );

    return (
        <ScreenWrapper title="Clients">
            <View style={styles.container}>
                <Text style={styles.title}>Your Clients</Text>
                <FlatList
                    data={clients}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderClient}
                    contentContainerStyle={{ paddingVertical: 10 }}
                />
            </View>
        </ScreenWrapper>
    );
};

const makeStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: theme.background,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 20,
        color: theme.text,
    },
    card: {
        backgroundColor: theme.card,
        padding: 16,
        borderRadius: 10,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: theme.border,
    },
    pressed: { opacity: 0.75 },
    clientName: {
        fontSize: 17,
        fontWeight: '600',
        color: theme.text,
    },
});

export default ClientsListScreen;
