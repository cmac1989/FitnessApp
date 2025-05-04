import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import dashboardStyles from '../../styles/DashboardStyles';
import ScreenWrapper from "../../components/ScreenWrapper";

const ClientsListScreen = () => {
    const navigation = useNavigation();
    const [clients, setClients] = useState([]);

    useEffect(() => {
        // Simulated API call — replace with your backend fetch later
        const fetchClients = async () => {
            const mockClients = [
                {
                    id: 1,
                    name: 'Sarah Connor',
                    age: 32,
                    goals: 'lose weight',
                },
                {
                    id: 2,
                    name: 'John Connor',
                    age: 32,
                    goals: 'lose weight',
                },
                {
                    id: 3,
                    name: 'Emily Carter',
                    age: 32,
                    goals: 'lose weight',
                },
            ];
            setClients(mockClients);
        };

        fetchClients();
    }, []);

    const renderClient = ({ item }) => (
        <Pressable
            style={dashboardStyles.statCard}
            onPress={() => navigation.navigate('ClientDetails', { clients: item })}
        >
            <Text style={dashboardStyles.statValue}>{item.name}</Text>
        </Pressable>
    );

    return (
        <ScreenWrapper title="Clients">
            <View style={dashboardStyles.container}>
                <Text style={dashboardStyles.title}>Your Clients</Text>
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

export default ClientsListScreen;
