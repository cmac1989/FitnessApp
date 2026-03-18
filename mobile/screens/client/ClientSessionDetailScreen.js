import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRoute } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';

const ClientSessionDetailScreen = () => {
    const route = useRoute();
    const session = route.params?.session;

    if (!session) {
        return (
            <ScreenWrapper title="Session Details">
                <View style={styles.centered}>
                    <Text style={styles.errorText}>No session details available.</Text>
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper title="Session Details">
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>Session Details</Text>

                <View style={styles.card}>
                    <Text style={styles.label}>Trainer</Text>
                    <Text style={styles.value}>{session.trainer}</Text>

                    <Text style={styles.label}>Date</Text>
                    <Text style={styles.value}>{session.date}</Text>

                    <Text style={styles.label}>Time</Text>
                    <Text style={styles.value}>{session.time}</Text>

                    <Text style={styles.label}>Location</Text>
                    <Text style={styles.value}>{session.location}</Text>

                    {session.status ? (
                        <>
                            <Text style={styles.label}>Status</Text>
                            <Text style={styles.value}>{session.status}</Text>
                        </>
                    ) : null}
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#f8f8f8',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    card: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 4,
        elevation: 2,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 15,
        color: '#444',
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

export default ClientSessionDetailScreen;
