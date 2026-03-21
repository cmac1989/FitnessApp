import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Easing,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useTheme } from '../src/theme';

const OUTER = 140;
const INNER = 96;

const HomeScreen = ({ navigation }) => {
    const { theme } = useTheme();

    const fadeIn       = useRef(new Animated.Value(0)).current;
    const scale        = useRef(new Animated.Value(0.4)).current;
    const outerRot     = useRef(new Animated.Value(0)).current;
    const innerRot     = useRef(new Animated.Value(0)).current;
    const titleOpacity = useRef(new Animated.Value(0)).current;
    const exitOpacity  = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.sequence([
            // 1. Scale + fade spinner in
            Animated.parallel([
                Animated.spring(scale, {
                    toValue: 1,
                    tension: 65,
                    friction: 8,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeIn, {
                    toValue: 1,
                    duration: 450,
                    useNativeDriver: true,
                }),
            ]),
            // 2. App name fades in
            Animated.timing(titleOpacity, {
                toValue: 1,
                duration: 350,
                useNativeDriver: true,
            }),
            // 3. Spin twice (outer clockwise, inner counter-clockwise)
            Animated.parallel([
                Animated.timing(outerRot, {
                    toValue: 2,
                    duration: 2000,
                    easing: Easing.inOut(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.timing(innerRot, {
                    toValue: -2,
                    duration: 2000,
                    easing: Easing.inOut(Easing.cubic),
                    useNativeDriver: true,
                }),
            ]),
            // 4. Brief hold
            Animated.delay(250),
            // 5. Fade out everything
            Animated.timing(exitOpacity, {
                toValue: 0,
                duration: 450,
                useNativeDriver: true,
            }),
        ]).start(() => {
            navigation.replace('Login');
        });
    }, []);

    const outerSpin = outerRot.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const innerSpin = innerRot.interpolate({
        inputRange: [-1, 0],
        outputRange: ['-360deg', '0deg'],
    });

    return (
        <Animated.View style={[styles.container, { backgroundColor: theme.background, opacity: exitOpacity }]}>
            <StatusBar
                barStyle={theme.dark ? 'light-content' : 'dark-content'}
                backgroundColor={theme.background}
            />

            {/* Spinner */}
            <Animated.View style={{ opacity: fadeIn, transform: [{ scale }], alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: OUTER, height: OUTER, alignItems: 'center', justifyContent: 'center' }}>
                    {/* Outer arc ring */}
                    <Animated.View style={[
                        styles.ring,
                        {
                            width: OUTER,
                            height: OUTER,
                            borderRadius: OUTER / 2,
                            borderWidth: 5,
                            borderTopColor: theme.primary,
                            borderRightColor: theme.primary,
                            borderBottomColor: 'transparent',
                            borderLeftColor: theme.primary,
                            position: 'absolute',
                            transform: [{ rotate: outerSpin }],
                        },
                    ]} />

                    {/* Inner arc ring (opposite direction) */}
                    <Animated.View style={[
                        styles.ring,
                        {
                            width: INNER,
                            height: INNER,
                            borderRadius: INNER / 2,
                            borderWidth: 4,
                            borderTopColor: 'transparent',
                            borderRightColor: theme.accent,
                            borderBottomColor: theme.accent,
                            borderLeftColor: 'transparent',
                            position: 'absolute',
                            transform: [{ rotate: innerSpin }],
                        },
                    ]} />

                    {/* Center dot */}
                    <View style={[styles.centerDot, { backgroundColor: theme.primary }]} />
                </View>
            </Animated.View>

            {/* App title */}
            <Animated.Text style={[styles.appName, { color: theme.text, opacity: titleOpacity }]}>
                FitTrainer
            </Animated.Text>
            <Animated.Text style={[styles.tagline, { color: theme.textSecondary, opacity: titleOpacity }]}>
                Get Stronger, Fitter, Better.
            </Animated.Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 28,
    },
    ring: {
        // base ring shape — colors applied inline
    },
    centerDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
    },
    appName: {
        fontSize: 34,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    tagline: {
        fontSize: 15,
        marginTop: -16,
    },
});

export default HomeScreen;
