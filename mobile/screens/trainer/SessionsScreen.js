import React, {useState, useEffect, useCallback} from 'react';
import {View, Text, FlatList, StyleSheet, Pressable, Alert, ActivityIndicator} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import CustomButton from '../../components/CustomButton';
import ScreenWrapper from '../../components/ScreenWrapper';
import {getAllSessions} from '../../src/api/trainingSession';

const SessionsScreen = () => {
    const navigation = useNavigation();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchSessions = async () => {
        try {
            const data = await getAllSessions();
            console.log('Fetched sessions:', data);

            const formattedSessions = data.map(session => ({
                id: session.id.toString(),
                client: session.client ? session.client.name : 'Unknown',
                date: session.scheduled_at.substring(0, 10),
                time: session.scheduled_at.substring(11, 16),
                location: session.location,
            }));

            setSessions(formattedSessions);
        } catch(error) {
            console.error('Could not load sessions', error);
            Alert.alert('Error', 'Could not load sessions.');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchSessions();
        }, [])
    );

    const renderSessionItem = ({ item }) => (
        <Pressable onPress={() => navigation.navigate('SessionDetail', { session: item, refreshSession: fetchSessions })}>
            <View style={styles.sessionCard}>
                <Text style={styles.sessionTitle}>{item.client}</Text>
                <Text style={styles.sessionDetail}>{item.date} at {item.time}</Text>
                <Text style={styles.sessionDetail}>Location: {item.location}</Text>
            </View>
        </Pressable>
    );
    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#000" />
            </View>
        );
    }

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
