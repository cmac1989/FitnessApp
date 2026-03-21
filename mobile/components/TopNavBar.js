import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Badge } from 'react-native-elements';
import { getUnreadMessageCount } from '../src/api/message';
import { getUnreadNotificationCount } from '../src/api/notification';
import { useTheme } from '../src/theme';

const TopNavBar = ({ title = '' }) => {
    const navigation = useNavigation();
    const { theme } = useTheme();
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
            setMessageCount(response.unread_count);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchNotificationCount = async () => {
        try {
            const response = await getUnreadNotificationCount();
            setNotificationCount(response.unread_count);
        } catch (error) {
            console.error(error);
        }
    };

    const handleMessagePress = () => navigation.navigate('MessageList');
    const handleNotificationPress = () => navigation.navigate('Notifications');

    const styles = makeStyles(theme);

    return (
        <SafeAreaView style={{ backgroundColor: theme.navBar }}>
            <View style={styles.container}>
                <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                    <Icon name="person-circle-outline" size={30} color={theme.navBarIcon} />
                </TouchableOpacity>

                <Text style={styles.title}>{title}</Text>

                <View style={styles.rightIcons}>
                    <TouchableOpacity onPress={handleMessagePress}>
                        <View>
                            <Icon
                                name="chatbubble-ellipses-outline"
                                size={28}
                                color={theme.navBarIcon}
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
                            <Icon name="notifications-outline" size={28} color={theme.navBarIcon} />
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

const makeStyles = (theme) => StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        backgroundColor: theme.navBar,
        borderBottomWidth: 1,
        borderBottomColor: theme.navBarBorder,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.navBarText,
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
        position: 'absolute',
        right: 3,
    },
});

export default TopNavBar;
