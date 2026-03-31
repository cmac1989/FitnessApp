import React, { useState, useCallback } from 'react';
import {
    View, Text, TextInput, ScrollView, StyleSheet,
    KeyboardAvoidingView, Platform, TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { validateRegisterForm, validateField } from '../src/utils/validation';
import { registerUser } from '../src/api/auth';
import { useTheme } from '../src/theme';
import { useToast } from '../src/context/ToastContext';

// ─────────────────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
    name:                 '',
    email:                '',
    password:             '',
    password_confirmation:'',
    role:                 'client',
    profile_picture:      '',
    bio:                  '',
    age:                  '',
    gender:               '',
    fitness_goals:        '',
    medical_conditions:   '',
    certifications:       '',
    years_experience:     '',
    specialties:          '',
    availability:         'available',
    location:             '',
};

const GENDER_OPTIONS = [
    { label: 'Male',   value: 'M' },
    { label: 'Female', value: 'F' },
    { label: 'Other',  value: 'O' },
];

// ── Stable sub-components (defined outside to prevent remount on re-render) ───

const SectionLabel = ({ icon, title, theme }) => {
    const styles = sectionStyles(theme);
    return (
        <View style={styles.wrap}>
            <Icon name={icon} size={12} color={theme.textMuted} />
            <Text style={styles.title}>{title}</Text>
            <View style={styles.line} />
        </View>
    );
};

const sectionStyles = (theme) => StyleSheet.create({
    wrap:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 28, marginBottom: 14 },
    title: { fontSize: 11, fontWeight: '700', color: theme.textMuted, letterSpacing: 1.0 },
    line:  { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: theme.border },
});

// ─────────────────────────────────────────────────────────────────────────────

const FieldInput = ({
    label, iconName, fieldKey,
    secure, secureVisible, toggleSecure,
    userInfo, errors, onUpdate,
    theme, multiline,
    ...rest
}) => {
    const hasError  = !!errors[fieldKey];
    const hasValue  = !!userInfo[fieldKey];
    const s         = fieldStyles(theme);

    const handleChange = rest.onChangeText ?? ((text) => onUpdate(fieldKey, text));
    const { onChangeText: _ignored, ...textInputRest } = rest;

    return (
        <View style={s.wrap}>
            <View style={[
                s.row,
                multiline && s.rowMultiline,
                hasError && s.rowError,
                hasValue && !hasError && s.rowFilled,
            ]}>
                <Icon
                    name={iconName}
                    size={17}
                    color={hasError ? theme.error : hasValue ? theme.accent : theme.textMuted}
                    style={s.icon}
                />
                <TextInput
                    style={[s.input, multiline && s.inputMultiline]}
                    placeholder={label}
                    placeholderTextColor={theme.placeholder}
                    value={userInfo[fieldKey]}
                    onChangeText={handleChange}
                    color={theme.text}
                    secureTextEntry={secure && !secureVisible}
                    multiline={multiline}
                    textAlignVertical={multiline ? 'top' : 'center'}
                    {...textInputRest}
                />
                {secure && (
                    <TouchableOpacity onPress={toggleSecure} style={s.eyeBtn} activeOpacity={0.65}>
                        <Icon
                            name={secureVisible ? 'eye-off-outline' : 'eye-outline'}
                            size={18}
                            color={theme.textMuted}
                        />
                    </TouchableOpacity>
                )}
            </View>
            {hasError
                ? <Text style={s.error}>{errors[fieldKey]}</Text>
                : <View style={s.errorSpacer} />}
        </View>
    );
};

const fieldStyles = (theme) => StyleSheet.create({
    wrap:          { marginBottom: 4 },
    row:           {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: theme.inputBackground,
        borderRadius: 14, borderWidth: 1.5,
        borderColor: theme.inputBorder,
        paddingHorizontal: 14, height: 52,
    },
    rowMultiline:  { height: 'auto', minHeight: 80, paddingVertical: 12, alignItems: 'flex-start' },
    rowError:      { borderColor: theme.error, backgroundColor: theme.error + '08' },
    rowFilled:     { borderColor: theme.accent + '55' },
    icon:          { marginRight: 10, flexShrink: 0 },
    input:         { flex: 1, fontSize: 15, color: theme.text, padding: 0 },
    inputMultiline:{ paddingTop: 2 },
    eyeBtn:        { padding: 4, marginLeft: 6 },
    error:         { fontSize: 12, color: theme.error, marginTop: 5, marginLeft: 4 },
    errorSpacer:   { height: 10 },
});

// ─────────────────────────────────────────────────────────────────────────────

const ChipGroup = ({ options, value, onSelect, theme }) => {
    const s = chipStyles(theme);
    return (
        <View style={s.row}>
            {options.map(opt => {
                const v      = opt.value ?? opt.toLowerCase();
                const active = value === v;
                return (
                    <TouchableOpacity
                        key={v}
                        style={[s.chip, active && s.chipActive]}
                        onPress={() => onSelect(v)}
                        activeOpacity={0.75}
                    >
                        <Text style={[s.text, active && s.textActive]}>
                            {opt.label ?? opt}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const chipStyles = (theme) => StyleSheet.create({
    row:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
    chip:      {
        paddingHorizontal: 18, paddingVertical: 9,
        borderRadius: 20, borderWidth: 1.5,
        borderColor: theme.inputBorder,
        backgroundColor: theme.inputBackground,
    },
    chipActive:{ borderColor: theme.primary, backgroundColor: theme.primary + '18' },
    text:      { fontSize: 13, fontWeight: '600', color: theme.textMuted },
    textActive:{ color: theme.primary, fontWeight: '700' },
});

// ─────────────────────────────────────────────────────────────────────────────

const RegisterForm = ({ navigation }) => {
    const { theme }  = useTheme();
    const styles     = makeStyles(theme);
    const { showToast } = useToast();

    const [userInfo,            setUserInfo]            = useState(EMPTY_FORM);
    const [errors,              setErrors]              = useState({});
    const [generalError,        setGeneralError]        = useState('');
    const [showPassword,        setShowPassword]        = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading,             setLoading]             = useState(false);

    useFocusEffect(
        useCallback(() => {
            setUserInfo(EMPTY_FORM);
            setErrors({});
            setGeneralError('');
        }, [])
    );

    const update = (key, value) => {
        setUserInfo(prev => ({ ...prev, [key]: value }));
        setErrors(prev => ({ ...prev, [key]: validateField(key, value, userInfo) }));
    };

    const normalizeTrainerPayload = (data) => ({
        ...data,
        years_experience: data.years_experience === '' ? null : parseInt(data.years_experience, 10),
        specialties: data.specialties.split(',').map(s => s.trim()).filter(Boolean),
    });

    const handleRegister = async () => {
        const validationErrors = validateRegisterForm(userInfo);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            setGeneralError('');
            return;
        }
        setLoading(true);
        try {
            setGeneralError('');
            setErrors({});
            const payload = userInfo.role === 'trainer'
                ? normalizeTrainerPayload(userInfo)
                : {
                    ...userInfo,
                    years_experience: userInfo.years_experience === '' ? null : parseInt(userInfo.years_experience, 10),
                };
            await registerUser(payload);
            showToast('Account created! Sign in to get started.', 'success');
            setTimeout(() => navigation.reset({ index: 0, routes: [{ name: 'Login' }] }), 1800);
        } catch (error) {
            const backendErrors = error.validationErrors || {};
            const flat = Object.fromEntries(
                Object.entries(backendErrors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
            );
            if (Object.keys(flat).length > 0) {
                setErrors(prev => ({ ...prev, ...flat }));
                setGeneralError('Please fix the errors below.');
            } else {
                setGeneralError(error.message || 'Registration failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Shared props passed to every FieldInput
    const fieldProps = { userInfo, errors, onUpdate: update, theme };

    return (
        <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView
                style={styles.flex}
                contentContainerStyle={styles.scroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* ── Back link ── */}
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => navigation.navigate('Login')}
                    activeOpacity={0.7}
                >
                    <Icon name="chevron-back" size={18} color={theme.textSecondary} />
                    <Text style={styles.backBtnText}>Back to login</Text>
                </TouchableOpacity>

                {/* ── Hero heading ── */}
                <View style={styles.hero}>
                    <View style={[styles.heroIcon, { backgroundColor: theme.primary + '18' }]}>
                        <Text style={[styles.heroIconText, { color: theme.primary }]}>✦</Text>
                    </View>
                    <Text style={styles.heroTitle}>Create Account</Text>
                    <Text style={styles.heroSubtitle}>Join and start your fitness journey</Text>
                </View>

                {/* ════════════════ ACCOUNT ════════════════ */}
                <SectionLabel icon="person-outline" title="ACCOUNT" theme={theme} />

                <FieldInput
                    {...fieldProps}
                    label="Full name"
                    iconName="person-outline"
                    fieldKey="name"
                    textContentType="name"
                    autoComplete="name"
                    autoCapitalize="words"
                />
                <FieldInput
                    {...fieldProps}
                    label="Email address"
                    iconName="mail-outline"
                    fieldKey="email"
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    autoComplete="email"
                    autoCapitalize="none"
                />
                <FieldInput
                    {...fieldProps}
                    label="Password"
                    iconName="lock-closed-outline"
                    fieldKey="password"
                    secure
                    secureVisible={showPassword}
                    toggleSecure={() => setShowPassword(v => !v)}
                    textContentType="newPassword"
                    autoComplete="password-new"
                    onChangeText={text => {
                        setUserInfo(prev => ({ ...prev, password: text }));
                        setErrors(prev => ({
                            ...prev,
                            password: validateField('password', text, userInfo),
                            password_confirmation: validateField(
                                'password_confirmation',
                                userInfo.password_confirmation,
                                { ...userInfo, password: text }
                            ),
                        }));
                    }}
                />
                <FieldInput
                    {...fieldProps}
                    label="Confirm password"
                    iconName="lock-closed-outline"
                    fieldKey="password_confirmation"
                    secure
                    secureVisible={showConfirmPassword}
                    toggleSecure={() => setShowConfirmPassword(v => !v)}
                    textContentType="newPassword"
                    autoComplete="password-new"
                />
                <FieldInput
                    {...fieldProps}
                    label="Bio (optional)"
                    iconName="chatbubble-ellipses-outline"
                    fieldKey="bio"
                    multiline
                    placeholder="Tell us a little about yourself"
                />

                {/* ════════════════ ROLE ════════════════ */}
                <SectionLabel icon="people-outline" title="I AM A" theme={theme} />
                <Text style={styles.sectionHint}>Choose how you'll use the app</Text>

                <View style={styles.roleRow}>
                    {[
                        { role: 'client',  icon: 'body-outline',    title: 'Client',  desc: "I'm looking for\na personal trainer" },
                        { role: 'trainer', icon: 'barbell-outline',  title: 'Trainer', desc: "I'm a fitness\nprofessional & coach" },
                    ].map(({ role, icon, title, desc }) => {
                        const active = userInfo.role === role;
                        return (
                            <TouchableOpacity
                                key={role}
                                style={[styles.roleCard, active && styles.roleCardActive]}
                                onPress={() => setUserInfo(prev => ({ ...prev, role }))}
                                activeOpacity={0.8}
                            >
                                <View style={[styles.roleIconWrap, active && styles.roleIconWrapActive]}>
                                    <Icon name={icon} size={28} color={active ? '#fff' : theme.textMuted} />
                                </View>
                                <Text style={[styles.roleCardTitle, active && styles.roleCardTitleActive]}>
                                    {title}
                                </Text>
                                <Text style={[styles.roleCardDesc, active && styles.roleCardDescActive]}>
                                    {desc}
                                </Text>
                                {active && (
                                    <View style={styles.roleCheck}>
                                        <Icon name="checkmark-circle" size={16} color={theme.primary} />
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* ════════════════ PROFILE ════════════════ */}
                <SectionLabel icon="clipboard-outline" title="YOUR PROFILE" theme={theme} />

                {userInfo.role === 'client' && (
                    <>
                        <FieldInput
                            {...fieldProps}
                            label="Age"
                            iconName="calendar-outline"
                            fieldKey="age"
                            keyboardType="numeric"
                        />

                        <Text style={styles.fieldLabel}>Gender</Text>
                        <ChipGroup
                            options={GENDER_OPTIONS}
                            value={userInfo.gender}
                            onSelect={val => update('gender', val)}
                            theme={theme}
                        />

                        <FieldInput
                            {...fieldProps}
                            label="Fitness goal"
                            iconName="fitness-outline"
                            fieldKey="fitness_goals"
                            multiline
                            placeholder="What do you want to achieve?"
                        />
                        <FieldInput
                            {...fieldProps}
                            label="Medical conditions (optional)"
                            iconName="medkit-outline"
                            fieldKey="medical_conditions"
                            multiline
                            placeholder="Any conditions we should know about"
                        />
                    </>
                )}

                {userInfo.role === 'trainer' && (
                    <>
                        <FieldInput
                            {...fieldProps}
                            label="Certifications"
                            iconName="ribbon-outline"
                            fieldKey="certifications"
                            placeholder="e.g. NASM, ACE, CSCS"
                        />
                        <FieldInput
                            {...fieldProps}
                            label="Years of experience"
                            iconName="time-outline"
                            fieldKey="years_experience"
                            keyboardType="numeric"
                        />
                        <FieldInput
                            {...fieldProps}
                            label="Specialties"
                            iconName="star-outline"
                            fieldKey="specialties"
                            placeholder="Strength Training, Weight Loss, …"
                        />
                        <FieldInput
                            {...fieldProps}
                            label="Location"
                            iconName="location-outline"
                            fieldKey="location"
                            placeholder="Your city or region"
                        />

                        <Text style={styles.fieldLabel}>Availability</Text>
                        <ChipGroup
                            options={[
                                { label: 'Available',   value: 'available' },
                                { label: 'Unavailable', value: 'unavailable' },
                            ]}
                            value={userInfo.availability}
                            onSelect={val => setUserInfo(prev => ({ ...prev, availability: val }))}
                            theme={theme}
                        />
                    </>
                )}

                {/* ── General error ── */}
                {generalError ? (
                    <View style={styles.errorBanner}>
                        <Icon name="alert-circle-outline" size={16} color={theme.error} />
                        <Text style={styles.errorBannerText}>{generalError}</Text>
                    </View>
                ) : null}

                {/* ── CTA ── */}
                <TouchableOpacity
                    style={[styles.registerBtn, loading && styles.registerBtnLoading]}
                    onPress={handleRegister}
                    disabled={loading}
                    activeOpacity={0.85}
                >
                    {loading
                        ? <ActivityIndicator size="small" color="#fff" />
                        : (
                            <>
                                <Text style={styles.registerBtnText}>Create Account</Text>
                                <Icon name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
                            </>
                        )
                    }
                </TouchableOpacity>

                {/* ── Login link ── */}
                <View style={styles.loginRow}>
                    <Text style={styles.loginRowText}>Already have an account?</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
                        <Text style={styles.loginRowLink}> Sign in</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 48 }} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

// ─────────────────────────────────────────────────────────────────────────────

const makeStyles = (theme) => StyleSheet.create({
    flex: { flex: 1 },

    scroll: {
        paddingHorizontal: 24,
        paddingTop: 16,
        backgroundColor: theme.background,
    },

    // Back button
    backBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        alignSelf: 'flex-start',
        paddingVertical: 4,
        marginBottom: 28,
    },
    backBtnText: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.textSecondary,
    },

    // Hero
    hero: {
        alignItems: 'center',
        marginBottom: 8,
    },
    heroIcon: {
        width: 56,
        height: 56,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    heroIconText: {
        fontSize: 26,
        fontWeight: '700',
    },
    heroTitle: {
        fontSize: 30,
        fontWeight: '800',
        color: theme.text,
        letterSpacing: -0.5,
        marginBottom: 6,
    },
    heroSubtitle: {
        fontSize: 15,
        color: theme.textSecondary,
        textAlign: 'center',
    },

    // Section hint
    sectionHint: {
        fontSize: 13,
        color: theme.textMuted,
        marginBottom: 12,
        marginTop: -6,
    },

    // Role cards
    roleRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 4,
    },
    roleCard: {
        flex: 1,
        backgroundColor: theme.card,
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: theme.border,
        padding: 16,
        alignItems: 'center',
        gap: 8,
    },
    roleCardActive: {
        borderColor: theme.primary,
        backgroundColor: theme.primary + '0C',
    },
    roleIconWrap: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: theme.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    roleIconWrapActive: {
        backgroundColor: theme.primary,
    },
    roleCardTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.text,
    },
    roleCardTitleActive: {
        color: theme.primary,
    },
    roleCardDesc: {
        fontSize: 12,
        color: theme.textMuted,
        textAlign: 'center',
        lineHeight: 17,
    },
    roleCardDescActive: {
        color: theme.primary + 'BB',
    },
    roleCheck: {
        position: 'absolute',
        top: 10,
        right: 10,
    },

    // Field label (above chip groups)
    fieldLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.textMuted,
        letterSpacing: 0.5,
        marginBottom: 8,
        marginTop: 4,
    },

    // General error banner
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: theme.error + '12',
        borderWidth: 1,
        borderColor: theme.error + '33',
        borderRadius: 12,
        padding: 12,
        marginTop: 8,
        marginBottom: 4,
    },
    errorBannerText: {
        flex: 1,
        fontSize: 13,
        color: theme.error,
        fontWeight: '500',
    },

    // CTA button
    registerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.primary,
        borderRadius: 16,
        height: 56,
        marginTop: 20,
        shadowColor: theme.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.30,
        shadowRadius: 10,
        elevation: 5,
    },
    registerBtnLoading: {
        opacity: 0.75,
    },
    registerBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: 0.2,
    },

    // Login row
    loginRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
    },
    loginRowText: {
        fontSize: 14,
        color: theme.textSecondary,
    },
    loginRowLink: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.primary,
    },
});

export default RegisterForm;
