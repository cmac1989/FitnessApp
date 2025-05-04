import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import CustomButton from '../../components/CustomButton';
import ScreenWrapper from '../../components/ScreenWrapper';

const EditWorkoutScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { workout } = route.params;

    const [name, setName] = useState(workout.name);
    const [warmUp, setWarmUp] = useState(workout.warmUp);
    const [mainSet, setMainSet] = useState(workout.mainSet);
    const [accessories, setAccessories] = useState(workout.accessories);

    const handleSave = () => {
        // Here you'd make your API call to update the workout
        Alert.alert('Success', 'Workout details updated.');
        navigation.goBack();
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Edit Workout</Text>

            <Text style={styles.label}>Workout Name</Text>
            <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
            />

            <Text style={styles.label}>Warm Up</Text>
            <TextInput
                style={[styles.input, styles.multiLine]}
                value={warmUp}
                onChangeText={setWarmUp}
                multiline
            />

            <Text style={styles.label}>Main Set</Text>
            <TextInput
                style={[styles.input, styles.multiLine]}
                value={mainSet}
                onChangeText={setMainSet}
                multiline
            />

            <Text style={styles.label}>Accessories</Text>
            <TextInput
                style={[styles.input, styles.multiLine]}
                value={accessories}
                onChangeText={setAccessories}
                multiline
            />

            <CustomButton title="Save Changes" onPress={handleSave} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#f8f8f8',
        flexGrow: 1,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 10,
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginTop: 5,
        borderColor: '#ddd',
        borderWidth: 1,
    },
    multiLine: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
});

export default EditWorkoutScreen;
