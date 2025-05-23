import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Badge } from 'react-native-elements';
import {getUnreadMessageCount, markMessageAsRead} from '../src/api/message';
import {getUnreadNotificationCount} from '../src/api/notification';

const TopNavBar = ({ title = '' }) => {
    const navigation = useNavigation();
    const [messageCount, setMessageCount] = useState(0);
    const [notificationCount, setNotificationCount] = useState(0);

    useFocusEffect(
        React.useCallback(() => {
            fetchNotificationCount();
            fetchMessageCount();
        }, [])
    );

    const fetchMessageCount = async () => {
        try {
            const response = await getUnreadMessageCount();
            console.log(response.unread_count);
            setMessageCount(response.unread_count);
        } catch (error) {
            console.error(error);
        }
    };

    const handleMessagePress = () => {
            navigation.navigate('MessageList');
    };

    const handleNotificationPress = () => {
        navigation.navigate('Notifications');
    };

    const fetchNotificationCount = async () => {
        try {
            const response = await getUnreadNotificationCount();
            console.log(response);
            setNotificationCount(response.unread_count);
            console.log(notificationCount);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <SafeAreaView>
            <View style={styles.container}>
                <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                    <Icon name="person-circle-outline" size={30} color="#333" />
                </TouchableOpacity>

                <Text style={styles.title}>{title}</Text>

                <View style={styles.rightIcons}>
                    <TouchableOpacity onPress={handleMessagePress}>
                    <View>
                            <Icon
                                name="chatbubble-ellipses-outline"
                                size={28}
                                color="#333"
                                style={styles.iconSpacing}
                            />
                            {messageCount > 0 && (
                                <Badge
                                    value={messageCount}
                                    status="error"
                                    containerStyle={[styles.badgeStyle, styles.messageBadgeAdjustment]}
                                />
                            )}
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleNotificationPress}>
                        <View>
                            <Icon name="notifications-outline" size={28} color="#333" />
                            {notificationCount > 0 && (
                                <Badge
                                    value={notificationCount}
                                    status="primary"
                                    containerStyle={styles.badgeStyle}
                                />
                            )}
                        </View>
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
    badgeStyle: {
        position: 'absolute',
        top: -4,
        right: -8,
    },
    messageBadgeAdjustment: {
        position:'absolute',
        right: 3,
    },
});

export default TopNavBar;
