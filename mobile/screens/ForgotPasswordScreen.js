import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
    View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity,
    Animated, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../src/theme';
import { useToast } from '../src/context/ToastContext';
import { forgotPassword, resetPassword } from '../src/api/auth';

// ── OTP Box Input ─────────────────────────────────────────────────────────────

const OTPInput = ({ value, onChange, theme, styles }) => {
    const inputs = useRef([]);

    const handleChange = (text, index) => {
        // Handle paste — distribute digits across boxes
        const cleaned = text.replace(/[^0-9]/g, '');
        if (cleaned.length > 1) {
            const next = cleaned.slice(0, 6);
            onChange(next.padEnd(6, value.slice(next.length)).slice(0, 6));
            const focusIndex = Math.min(next.length, 5);
            inputs.current[focusIndex]?.focus();
            return;
        }

        const chars = value.split('');
        chars[index] = cleaned;
        const newVal = chars.join('').slice(0, 6);
        onChange(newVal);

        if (cleaned && index < 5) {
            inputs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = ({ nativeEvent }, index) => {
        if (nativeEvent.key === 'Backspace' && !value[index] && index > 0) {
            const chars = value.split('');
            chars[index - 1] = '';
            onChange(chars.join(''));
            inputs.current[index - 1]?.focus();
        }
    };

    return (
        <View style={styles.otpRow}>
            {[0, 1, 2, 3, 4, 5].map((i) => {
                const filled = !!value[i];
                return (
                    <TextInput
                        key={i}
                        ref={(r) => { inputs.current[i] = r; }}
                        style={[
                            styles.otpBox,
                            filled && styles.otpBoxFilled,
                        ]}
                        value={value[i] || ''}
                        onChangeText={(t) => handleChange(t, i)}
                        onKeyPress={(e) => handleKeyPress(e, i)}
                        keyboardType="number-pad"
                        maxLength={2}
                        selectTextOnFocus
                        caretHidden
                        textAlign="center"
                        color={theme.text}
                    />
                );
            })}
        </View>
    );
};

// ── Password field with eye toggle ────────────────────────────────────────────

const PasswordField = ({ value, onChangeText, placeholder, theme, styles, returnKeyType, onSubmitEditing, inputRef }) => {
    const [hidden, setHidden] = useState(true);

    return (
        <View style={styles.passwordWrap}>
            <TextInput
                ref={inputRef}
                style={[styles.input, { color: theme.text }]}
                placeholder={placeholder}
                placeholderTextColor={theme.placeholder}
                secureTextEntry={hidden}
                value={value}
                onChangeText={onChangeText}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType={returnKeyType ?? 'done'}
                onSubmitEditing={onSubmitEditing}
            />
            <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setHidden((h) => !h)}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
                <Icon
                    name={hidden ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={theme.textMuted}
                />
            </TouchableOpacity>
        </View>
    );
};

// ── Screen ────────────────────────────────────────────────────────────────────

const ForgotPasswordScreen = () => {
    const navigation = useNavigation();
    const insets     = useSafeAreaInsets();
    const { theme }  = useTheme();
    const styles     = makeStyles(theme, insets);
    const { showToast } = useToast();

    // ── State ──────────────────────────────────────────────────────────────────
    const [step, setStep]                       = useState(1);
    const [email, setEmail]                     = useState('');
    const [emailError, setEmailError]           = useState('');
    const [code, setCode]                       = useState('');
    const [newPassword, setNewPassword]         = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [codeError, setCodeError]             = useState('');
    const [passwordError, setPasswordError]     = useState('');
    const [sending, setSending]                 = useState(false);
    const [resetting, setResetting]             = useState(false);
    const [cooldown, setCooldown]               = useState(0);

    // ── Refs ───────────────────────────────────────────────────────────────────
    const confirmRef  = useRef(null);
    const timerRef    = useRef(null);

    // ── Animation ──────────────────────────────────────────────────────────────
    const fadeAnim    = useRef(new Animated.Value(1)).current;
    const translateY  = useRef(new Animated.Value(0)).current;

    const animateTransition = useCallback((callback) => {
        Animated.parallel([
            Animated.timing(fadeAnim,   { toValue: 0, duration: 180, useNativeDriver: true }),
            Animated.timing(translateY, { toValue: -24, duration: 180, useNativeDriver: true }),
        ]).start(() => {
            callback();
            translateY.setValue(28);
            Animated.parallel([
                Animated.timing(fadeAnim,   { toValue: 1, duration: 240, useNativeDriver: true }),
                Animated.timing(translateY, { toValue: 0, duration: 240, useNativeDriver: true }),
            ]).start();
        });
    }, [fadeAnim, translateY]);

    // ── Cooldown timer ─────────────────────────────────────────────────────────
    const startCooldown = useCallback(() => {
        setCooldown(60);
        timerRef.current = setInterval(() => {
            setCooldown((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, []);

    useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

    // ── Step 1: send code ──────────────────────────────────────────────────────
    const handleSendCode = async () => {
        const trimmed = email.trim().toLowerCase();
        if (!trimmed) {
            setEmailError('Please enter your email address.');
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
            setEmailError('Please enter a valid email address.');
            return;
        }
        setEmailError('');
        setSending(true);
        try {
            await forgotPassword(trimmed);
            startCooldown();
            animateTransition(() => {
                setStep(2);
                setCode('');
                setNewPassword('');
                setConfirmPassword('');
            });
        } catch (err) {
            const msg = err.response?.data?.message ?? 'Something went wrong. Please try again.';
            // 429 rate limit
            if (err.response?.status === 429) {
                setEmailError(msg);
            } else {
                showToast(msg, 'error');
            }
        } finally {
            setSending(false);
        }
    };

    // ── Resend code ────────────────────────────────────────────────────────────
    const handleResend = async () => {
        if (cooldown > 0) return;
        setSending(true);
        try {
            await forgotPassword(email.trim().toLowerCase());
            startCooldown();
            showToast('A new code has been sent.', 'success');
        } catch (err) {
            const msg = err.response?.data?.message ?? 'Could not resend code. Please try again.';
            showToast(msg, 'error');
        } finally {
            setSending(false);
        }
    };

    // ── Step 2: reset password ─────────────────────────────────────────────────
    const handleReset = async () => {
        let valid = true;

        if (code.length !== 6) {
            setCodeError('Please enter the full 6-digit code.');
            valid = false;
        } else {
            setCodeError('');
        }

        if (newPassword.length < 8) {
            setPasswordError('Password must be at least 8 characters.');
            valid = false;
        } else if (newPassword !== confirmPassword) {
            setPasswordError('Passwords do not match.');
            valid = false;
        } else {
            setPasswordError('');
        }

        if (!valid) return;

        setResetting(true);
        try {
            await resetPassword(email.trim().toLowerCase(), code, newPassword, confirmPassword);
            showToast('Password reset! Please sign in.', 'success');
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        } catch (err) {
            const msg = err.response?.data?.message ?? 'Reset failed. Please try again.';
            if (err.response?.status === 422) {
                setCodeError(msg);
            } else {
                showToast(msg, 'error');
            }
        } finally {
            setResetting(false);
        }
    };

    // ── Render ─────────────────────────────────────────────────────────────────

    const renderStep1 = () => (
        <>
            {/* Icon */}
            <View style={styles.iconCircle}>
                <Icon name="lock-closed-outline" size={34} color={theme.primary} />
            </View>

            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
                Enter your registered email and we'll send you a 6-digit reset code.
            </Text>

            {/* Email input */}
            <Text style={styles.label}>EMAIL ADDRESS</Text>
            <View style={[styles.inputWrap, emailError && styles.inputWrapError]}>
                <Icon name="mail-outline" size={18} color={emailError ? theme.error : theme.textMuted} style={styles.inputIcon} />
                <TextInput
                    style={[styles.inputInner, { color: theme.text }]}
                    placeholder="you@example.com"
                    placeholderTextColor={theme.placeholder}
                    value={email}
                    onChangeText={(t) => { setEmail(t); if (emailError) setEmailError(''); }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="emailAddress"
                    autoComplete="email"
                    returnKeyType="send"
                    onSubmitEditing={handleSendCode}
                />
            </View>
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

            {/* Send button */}
            <TouchableOpacity
                style={[styles.primaryBtn, sending && styles.primaryBtnDisabled]}
                onPress={handleSendCode}
                disabled={sending}
                activeOpacity={0.82}
            >
                {sending ? (
                    <ActivityIndicator color="#fff" size="small" />
                ) : (
                    <Text style={styles.primaryBtnText}>Send Reset Code</Text>
                )}
            </TouchableOpacity>

            {/* Back to login */}
            <TouchableOpacity
                style={styles.secondaryLink}
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
            >
                <Icon name="arrow-back" size={14} color={theme.textMuted} />
                <Text style={styles.secondaryLinkText}>Back to sign in</Text>
            </TouchableOpacity>
        </>
    );

    const renderStep2 = () => (
        <>
            {/* Icon */}
            <View style={[styles.iconCircle, styles.iconCircleGreen]}>
                <Icon name="mail-open-outline" size={34} color="#059669" />
            </View>

            <Text style={styles.title}>Check Your Email</Text>
            <Text style={styles.subtitle}>
                We sent a 6-digit code to{'\n'}
                <Text style={styles.subtitleEmail}>{email}</Text>
            </Text>

            {/* OTP */}
            <Text style={styles.label}>RESET CODE</Text>
            <OTPInput value={code} onChange={setCode} theme={theme} styles={styles} />
            {codeError ? <Text style={styles.errorText}>{codeError}</Text> : null}

            {/* New password */}
            <Text style={[styles.label, { marginTop: 20 }]}>NEW PASSWORD</Text>
            <PasswordField
                value={newPassword}
                onChangeText={(t) => { setNewPassword(t); if (passwordError) setPasswordError(''); }}
                placeholder="At least 8 characters"
                theme={theme}
                styles={styles}
                returnKeyType="next"
                onSubmitEditing={() => confirmRef.current?.focus()}
            />

            {/* Confirm password */}
            <Text style={styles.label}>CONFIRM PASSWORD</Text>
            <PasswordField
                inputRef={confirmRef}
                value={confirmPassword}
                onChangeText={(t) => { setConfirmPassword(t); if (passwordError) setPasswordError(''); }}
                placeholder="Repeat new password"
                theme={theme}
                styles={styles}
                returnKeyType="done"
                onSubmitEditing={handleReset}
            />
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

            {/* Reset button */}
            <TouchableOpacity
                style={[styles.primaryBtn, resetting && styles.primaryBtnDisabled]}
                onPress={handleReset}
                disabled={resetting}
                activeOpacity={0.82}
            >
                {resetting ? (
                    <ActivityIndicator color="#fff" size="small" />
                ) : (
                    <Text style={styles.primaryBtnText}>Reset Password</Text>
                )}
            </TouchableOpacity>

            {/* Resend + wrong email */}
            <View style={styles.resendRow}>
                <Text style={styles.resendText}>Didn't get it? </Text>
                <TouchableOpacity
                    onPress={handleResend}
                    disabled={cooldown > 0 || sending}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.resendLink, (cooldown > 0 || sending) && styles.resendLinkDisabled]}>
                        {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
                    </Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={styles.secondaryLink}
                onPress={() => animateTransition(() => { setStep(1); setCode(''); setCodeError(''); setPasswordError(''); })}
                activeOpacity={0.7}
            >
                <Icon name="arrow-back" size={14} color={theme.textMuted} />
                <Text style={styles.secondaryLinkText}>Use a different email</Text>
            </TouchableOpacity>
        </>
    );

    return (
        <View style={styles.screen}>
            {/* Custom back button in safe area */}
            <TouchableOpacity
                style={styles.backBtn}
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
                <Icon name="chevron-back" size={24} color={theme.text} />
            </TouchableOpacity>

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }] }}>
                        {step === 1 ? renderStep1() : renderStep2()}
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const makeStyles = (theme, insets) => StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: theme.background,
        paddingTop: insets.top,
    },
    flex: { flex: 1 },

    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: theme.card,
        borderWidth: 1,
        borderColor: theme.border,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 16,
        marginTop: 8,
        marginBottom: 4,
    },

    scroll: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 32,
    },

    // Icon hero
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: theme.primary + '15',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginBottom: 24,
        shadowColor: theme.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
        elevation: 4,
    },
    iconCircleGreen: {
        backgroundColor: '#05966915',
        shadowColor: '#059669',
    },

    title: {
        fontSize: 28,
        fontWeight: '800',
        color: theme.text,
        textAlign: 'center',
        letterSpacing: -0.3,
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 15,
        color: theme.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
    },
    subtitleEmail: {
        fontWeight: '700',
        color: theme.text,
    },

    // Form labels
    label: {
        fontSize: 11,
        fontWeight: '700',
        color: theme.textMuted,
        letterSpacing: 0.8,
        marginBottom: 8,
        marginTop: 4,
    },

    // Standard input with leading icon
    inputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.inputBackground,
        borderWidth: 1.5,
        borderColor: theme.inputBorder,
        borderRadius: 14,
        paddingHorizontal: 14,
        marginBottom: 4,
        height: 52,
    },
    inputWrapError: {
        borderColor: theme.error,
        backgroundColor: theme.error + '08',
    },
    inputIcon: { marginRight: 10 },
    inputInner: {
        flex: 1,
        fontSize: 16,
        paddingVertical: 0,
    },

    // Password field
    passwordWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.inputBackground,
        borderWidth: 1.5,
        borderColor: theme.inputBorder,
        borderRadius: 14,
        paddingHorizontal: 14,
        marginBottom: 4,
        height: 52,
    },
    input: {
        flex: 1,
        fontSize: 16,
        paddingVertical: 0,
    },
    eyeBtn: {
        padding: 4,
        marginLeft: 6,
    },

    // Error text
    errorText: {
        fontSize: 13,
        color: theme.error,
        marginBottom: 12,
        marginLeft: 2,
    },

    // Primary button
    primaryBtn: {
        backgroundColor: theme.primary,
        borderRadius: 14,
        height: 54,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
        shadowColor: theme.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.28,
        shadowRadius: 10,
        elevation: 5,
    },
    primaryBtnDisabled: { opacity: 0.6 },
    primaryBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.2,
    },

    // Secondary link
    secondaryLink: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 20,
        paddingVertical: 4,
    },
    secondaryLinkText: {
        fontSize: 14,
        color: theme.textMuted,
        fontWeight: '500',
    },

    // OTP boxes
    otpRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
        marginBottom: 4,
    },
    otpBox: {
        flex: 1,
        height: 56,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: theme.inputBorder,
        backgroundColor: theme.inputBackground,
        fontSize: 24,
        fontWeight: '700',
        color: theme.text,
        textAlign: 'center',
    },
    otpBoxFilled: {
        borderColor: theme.primary,
        backgroundColor: theme.primary + '10',
        color: theme.primary,
    },

    // Resend
    resendRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
    },
    resendText: {
        fontSize: 14,
        color: theme.textMuted,
    },
    resendLink: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.accent,
    },
    resendLinkDisabled: {
        color: theme.textMuted,
    },
});

export default ForgotPasswordScreen;
