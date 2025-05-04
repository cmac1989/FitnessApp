import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, SafeAreaView} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

const TopNavBar = ({ title = '' }) => {
    const navigation = useNavigation();

    return (
        <SafeAreaView>
            <View style={styles.container}>
                <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                    <Icon name="person-circle-outline" size={30} color="#333" />
                </TouchableOpacity>

                <Text style={styles.title}>{title}</Text>

                <View style={styles.rightIcons}>
                    <TouchableOpacity onPress={() => navigation.navigate('Messages')}>
                        <Icon name="chatbubble-ellipses-outline" size={28} color="#333" style={styles.iconSpacing} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => console.log('Notifications')}>
                        <Icon name="notifications-outline" size={28} color="#333" />
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    rightIcons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconSpacing: {
        marginRight: 16,
    },
});

export default TopNavBar;
