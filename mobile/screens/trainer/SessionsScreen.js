import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import CustomButton from '../../components/CustomButton';
import ScreenWrapper from '../../components/ScreenWrapper';

const SessionsScreen = () => {
    const navigation = useNavigation();

    // Mock session data — replace with API call later
    const [sessions, setSessions] = useState([
        {
            id: '1',
            client: 'Alex Johnson',
            date: '2025-05-03',
            time: '10:00 AM',
            location: 'Gym A',
        },
        {
            id: '2',
            client: 'Maria Smith',
            date: '2025-05-03',
            time: '2:00 PM',
            location: 'Virtual',
        },
        {
            id: '3',
            client: 'Liam Chen',
            date: '2025-05-04',
            time: '9:00 AM',
            location: 'Gym B',
        },
    ]);

    const renderSessionItem = ({ item }) => (
        <Pressable onPress={() => navigation.navigate('SessionDetail', { session: item })}>
            <View style={styles.sessionCard}>
                <Text style={styles.sessionTitle}>{item.client}</Text>
                <Text style={styles.sessionDetail}>{item.date} at {item.time}</Text>
                <Text style={styles.sessionDetail}>Location: {item.location}</Text>
            </View>
        </Pressable>
    );

    return (
        <ScreenWrapper title="Sessions">
            <View style={styles.container}>
                <Text style={styles.title}>Upcoming Sessions</Text>

                <FlatList
                    data={sessions}
                    keyExtractor={(item) => item.id}
                    renderItem={renderSessionItem}
                    contentContainerStyle={styles.listContainer}
                />

                <CustomButton
                    title="Schedule New Session"
                    onPress={() => navigation.navigate('CreateSession')}
                />
            </View>
        </ScreenWrapper>
    );
};

//TODO move styles to its own file

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
    listContainer: {
        paddingBottom: 20,
    },
    sessionCard: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 4,
    },
    sessionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 5,
    },
    sessionDetail: {
        fontSize: 14,
        color: '#666',
    },
});

export default SessionsScreen;
