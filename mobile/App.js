import SessionDetailsScreen from './screens/trainer/SessionDetailsScreen';
import CreateSessionScreen from './screens/trainer/CreateSessionScreen';
import CreateWorkoutScreen from './screens/trainer/CreateWorkoutScreen';
import TrainerTabNavigator from './components/TrainerTabNavigator';
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import ClientDetailsScreen from './screens/trainer/ClientDetailsScreen';
import WorkoutDetailsScreen from './screens/trainer/WorkoutDetailsScreen';
import EditSessionScreen from './screens/trainer/EditSessionScreen';
import EditWorkoutScreen from './screens/trainer/EditWorkoutScreen';
import MessagesScreen from './screens/trainer/MessagesScreen';

const Stack = createStackNavigator();

const App = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: true }} initialRouteName="Home">
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Register" component={RegisterScreen} />

                {/* Tabs live inside a stack */}
                <Stack.Screen
                    name="TrainerHome"
                    component={TrainerTabNavigator}
                    options={{ headerShown: false }}
                />

                {/* Stack screens accessible from within tab screens */}
                <Stack.Screen name="CreateWorkout" component={CreateWorkoutScreen} />
                <Stack.Screen name="CreateSession" component={CreateSessionScreen} />
                <Stack.Screen name="SessionDetail" component={SessionDetailsScreen} />
                <Stack.Screen name="ClientDetails" component={ClientDetailsScreen} />
                <Stack.Screen name="WorkoutDetails" component={WorkoutDetailsScreen} />
                <Stack.Screen name="EditSession" component={EditSessionScreen} />
                <Stack.Screen name="EditWorkout" component={EditWorkoutScreen} />
                <Stack.Screen name="Messages" component={MessagesScreen} />

            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default App;
