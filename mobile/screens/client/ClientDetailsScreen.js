import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CustomButton from '../../components/CustomButton';
import { useNavigation, useRoute } from '@react-navigation/native';

const ClientDetailsScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { clients: client } = route.params;

    if (!client) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>No session details available.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Client Details</Text>

            <View style={styles.detailCard}>
                <Text style={styles.label}>Client:</Text>
                <Text style={styles.value}>{client.name}</Text>

                <Text style={styles.label}>Age:</Text>
                <Text style={styles.value}>{client.client_profile.age}</Text>

                <Text style={styles.label}>Gender:</Text>
                <Text style={styles.value}>{client.client_profile?.gender ?? 'N/A'}</Text>

                <Text style={styles.label}>Goals:</Text>
                <Text style={styles.value}>{client.client_profile?.fitness_goals ?? 'N/A'}</Text>

                <Text style={styles.label}>Medical Conditions:</Text>
                <Text style={styles.value}>{client.client_profile?.medical_conditions ?? 'N/A'}</Text>

            </View>


            <CustomButton
                title="Message"
                onPress={() => navigation.navigate('Messages', { client })}
            />
        </View>
    );
};
//TODO move to separate file
const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f8f8f8',
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    detailCard: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 4,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 10,
    },
    value: {
        fontSize: 16,
        color: '#333',
        marginTop: 2,
    },
    errorText: {
        fontSize: 18,
        color: 'red',
    },
});

export default ClientDetailsScreen;
