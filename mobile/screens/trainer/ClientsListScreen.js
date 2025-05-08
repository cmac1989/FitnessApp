import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import dashboardStyles from '../../styles/DashboardStyles';
import ScreenWrapper from '../../components/ScreenWrapper';
import {getClients} from '../../src/api/user';

const ClientsListScreen = () => {
    const navigation = useNavigation();
    const [clients, setClients] = useState([]);

    useEffect(() => {
        const fetchClients = async() => {
            try {
                const data = await getClients();
                console.log('fetched clients', data);
                setClients(data);
            } catch(error) {
                console.error('There was a problem fetching clients', error);
            }
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
