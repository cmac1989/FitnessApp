import React, { useEffect, useRef } from 'react';
import {
    Animated, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

const ICONS = {
    success: { name: 'checkmark-circle', bg: '#059669', iconColor: '#fff' },
    error:   { name: 'alert-circle',     bg: '#dc2626', iconColor: '#fff' },
    info:    { name: 'information-circle', bg: '#2563eb', iconColor: '#fff' },
};

const Toast = ({
    visible,
    message,
    type     = 'success',
    duration = 3200,
    onHide,
}) => {
    const insets     = useSafeAreaInsets();
    const translateY = useRef(new Animated.Value(-120)).current;
    const opacity    = useRef(new Animated.Value(0)).current;
    const timerRef   = useRef(null);

    const animateOut = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        Animated.parallel([
            Animated.timing(translateY, { toValue: -120, duration: 280, useNativeDriver: true }),
            Animated.timing(opacity,    { toValue: 0,    duration: 220, useNativeDriver: true }),
        ]).start(() => onHide?.());
    };

    useEffect(() => {
        if (timerRef.current) clearTimeout(timerRef.current);

        if (visible) {
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue:         0,
                    useNativeDriver: true,
                    tension:         72,
                    friction:        10,
                }),
                Animated.timing(opacity, {
                    toValue:         1,
                    duration:        180,
                    useNativeDriver: true,
                }),
            ]).start();

            timerRef.current = setTimeout(animateOut, duration);
        } else {
            animateOut();
        }

        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [visible]);

    const config = ICONS[type] ?? ICONS.success;

    return (
        <Animated.View
            style={[styles.wrapper, { top: insets.top + 8, transform: [{ translateY }], opacity }]}
            pointerEvents={visible ? 'box-none' : 'none'}
        >
            <View style={[styles.toast, { backgroundColor: config.bg }]}>
                <View style={styles.iconWrap}>
                    <Icon name={config.name} size={22} color={config.iconColor} />
                </View>
                <Text style={styles.message} numberOfLines={2}>{message}</Text>
                <TouchableOpacity
                    onPress={animateOut}
                    style={styles.closeBtn}
                    activeOpacity={0.65}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Icon name="close" size={16} color="rgba(255,255,255,0.75)" />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        position:  'absolute',
        left:      16,
        right:     16,
        zIndex:    9999,
        elevation: 12,
    },
    toast: {
        flexDirection:  'row',
        alignItems:     'center',
        borderRadius:   16,
        paddingVertical: 14,
        paddingLeft:    14,
        paddingRight:   10,
        gap:            10,
        shadowColor:    '#000',
        shadowOffset:   { width: 0, height: 6 },
        shadowOpacity:  0.18,
        shadowRadius:   12,
    },
    iconWrap: {
        flexShrink: 0,
    },
    message: {
        flex:       1,
        fontSize:   14,
        fontWeight: '600',
        color:      '#fff',
        lineHeight: 20,
    },
    closeBtn: {
        padding:    4,
        flexShrink: 0,
    },
});

export default Toast;
