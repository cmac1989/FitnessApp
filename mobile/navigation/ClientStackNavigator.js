import React from 'react';
import ClientTabNavigator from '../components/ClientTabNavigator';

// All screens are now registered in nested stacks inside ClientTabNavigator,
// so the tab bar remains visible throughout the app.
const ClientStackNavigator = () => <ClientTabNavigator />;

export default ClientStackNavigator;
