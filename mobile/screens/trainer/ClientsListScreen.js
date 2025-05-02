import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import dashboardStyles from '../../styles/DashboardStyles';

const ClientsListScreen = () => {
    const navigation = useNavigation();
    const [clients, setClients] = useState([]);

    useEffect(() => {
        // Simulated API call — replace with your backend fetch later
        const fetchClients = async () => {
            const mockClients = [
                { id: 1, name: 'Sarah Connor' },
                { id: 2, name: 'John Doe' },
                { id: 3, name: 'Emily Carter' },
            ];
            setClients(mockClients);
        };

        fetchClients();
    }, []);

    const renderClient = ({ item }) => (
        <Pressable
            style={dashboardStyles.statCard}
            onPress={() => navigation.navigate('ClientDetails', { clientId: item.id })}
        >
            <Text style={dashboardStyles.statValue}>{item.name}</Text>
        </Pressable>
    );

    return (
        <View style={dashboardStyles.container}>
            <Text style={dashboardStyles.title}>Your Clients</Text>
            <FlatList
                data={clients}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderClient}
                contentContainerStyle={{ paddingVertical: 10 }}
            />
        </View>
    );
};

export default ClientsListScreen;
