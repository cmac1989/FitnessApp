import {useFocusEffect, useNavigation} from '@react-navigation/native';
import React, {useCallback, useEffect, useState} from 'react';
import { View, FlatList, Pressable, Text, StyleSheet } from 'react-native';
import dashboardStyles from '../../styles/DashboardStyles';
import CustomButton from '../../components/CustomButton';
import ScreenWrapper from '../../components/ScreenWrapper';
import {getTrainerWorkouts} from '../../src/api/workout';

const WorkoutListScreen = () => {
    const navigation = useNavigation();
    const [workouts, setWorkouts] = useState([]);

    const fetchWorkouts = async () => {
        try {
            const data = await getTrainerWorkouts();
            setWorkouts(data);
            console.log('trainer workouts', workouts);
        } catch(error) {
            console.error('error fetching workouts', error);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchWorkouts();
        }, [])
    );

    const renderWorkout = ({ item }) => (
        <Pressable
            style={dashboardStyles.statCard}
            onPress={() => navigation.navigate('WorkoutDetails', { workout: item })}
        >
            <Text style={dashboardStyles.statValue}>{item.title}</Text>
        </Pressable>
    );

    return (
        <ScreenWrapper title="Workouts">
            <View style={styles.container}>
                <Text style={styles.title}>Workout Plans</Text>
                <FlatList
                    data={workouts}
                    keyExtractor={(item) => item.id}
                    renderItem={renderWorkout}
                    contentContainerStyle={{ paddingVertical: 10 }}
                />
                <CustomButton
                    title="Add Workout"
                    onPress={() => navigation.navigate('CreateWorkout')}
                />
                <CustomButton
                    title="Assign Workout"
                    // onPress={() => navigation.navigate('CreateWorkout')}
                />
            </View>
        </ScreenWrapper>
    );
};

// Local styles (could move to styles/WorkoutStyles.js)
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
});

export default WorkoutListScreen;
