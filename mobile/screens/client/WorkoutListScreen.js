import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { View, FlatList, Pressable, Text, StyleSheet } from 'react-native';
import dashboardStyles from '../../styles/DashboardStyles';
import CustomButton from '../../components/CustomButton';
import ScreenWrapper from '../../components/ScreenWrapper';

const WorkoutListScreen = () => {
    const navigation = useNavigation();
    const [workouts, setWorkouts] = useState([]);

    useEffect(() => {
        // Simulated API call — replace with your backend fetch later
        const fetchWorkouts = async () => {
            const mockWorkouts = [
                { id: '1', name: 'Upper Body Strength', warmUp: 'Jump rope', mainSet: 'Bench press, Pull-ups', accessories: 'Triceps dips' },
                { id: '2', name: 'Lower Body Blast', warmUp: 'Dynamic stretches', mainSet: 'Squats, Deadlifts', accessories: 'Leg curls' },
                { id: '3', name: 'HIIT Burner', warmUp: 'Light jog', mainSet: 'Sprints, Burpees', accessories: 'Plank holds' },
                { id: '4', name: 'Mobility Focus', warmUp: 'Foam rolling', mainSet: 'Dynamic mobility drills', accessories: 'Band work' },
            ];
            setWorkouts(mockWorkouts);
        };

        fetchWorkouts();
    }, []);

    const renderWorkout = ({ item }) => (
        <Pressable
            style={dashboardStyles.statCard}
            onPress={() => navigation.navigate('WorkoutDetails', { workout: item })}
        >
            <Text style={dashboardStyles.statValue}>{item.name}</Text>
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
