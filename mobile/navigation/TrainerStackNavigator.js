import React from 'react';
import TrainerTabNavigator from '../components/TrainerTabNavigator';

// All screens are now registered in nested stacks inside TrainerTabNavigator,
// so the tab bar remains visible throughout the app.
const TrainerStackNavigator = () => <TrainerTabNavigator />;

export default TrainerStackNavigator;
