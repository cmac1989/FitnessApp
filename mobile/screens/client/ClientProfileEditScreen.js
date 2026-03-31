import React, { useCallback, useState } from 'react';
import {
    View, Text, TextInput, StyleSheet, ScrollView,
    Alert, KeyboardAvoidingView, Platform, Switch, TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { userLogout, uploadAvatar } from '../../src/api/auth';
import { updateClientProfile } from '../../src/api/client';
import { useTheme } from '../../src/theme';
import { useToast } from '../../src/context/ToastContext';
import { useUser } from '../../src/context/UserContext';
import Avatar from '../../components/Avatar';

// ── Field row ─────────────────────────────────────────────────────────────────

const FieldRow = ({ label, last, children, styles }) => (
    <View style={[styles.fieldRow, !last && styles.fieldRowBorder]}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {children}
    </View>
);

// ── Screen ─────────────────────────────────────────────────────────────────────

const ClientProfileEditScreen = () => {
    const navigation = useNavigation();
    const route      = useRoute();
    const { theme, isDark, toggleTheme } = useTheme();
    const { showToast } = useToast();
    const { user, updateUser, clearUser } = useUser();

    const initial = route.params?.profile ?? {};
    const [profile, setProfile] = useState({
        id:                 initial.id                 ?? '',
        name:               initial.name               ?? '',
        email:              initial.email              ?? '',
        age:                initial.age != null ? initial.age.toString() : '',
        gender:             initial.gender             ?? '',
        fitness_goals:      initial.fitness_goals      ?? '',
        medical_conditions: initial.medical_conditions ?? '',
        profile_picture:    user?.profile_picture ?? initial.profile_picture ?? null,
    });
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    const set = (key) => (text) => setProfile(prev => ({ ...prev, [key]: text }));

    const handleSave = useCallback(async () => {
        if (saving) return;
        setSaving(true);
        try {
            await updateClientProfile({
                name:               profile.name,
                age:                profile.age.trim() !== '' ? parseInt(profile.age, 10) : null,
                gender:             profile.gender,
                fitness_goals:      profile.fitness_goals,
                medical_conditions: profile.medical_conditions,
            });
            showToast('Your profile has been updated.', 'success');
            navigation.goBack();
        } catch {
            showToast('Could not save profile. Please try again.', 'error');
        } finally {
            setSaving(false);
        }
    }, [saving, profile, navigation]);

    const handleLogout = useCallback(() => {
        Alert.alert('Log Out', 'Are you sure you want to log out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Log Out', style: 'destructive',
                onPress: async () => {
                    try {
                        await userLogout();
                        await clearUser();
                        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                    } catch {
                        showToast('Something went wrong logging out.', 'error');
                    }
                },
            },
        ]);
    }, [navigation]);

    const handlePickAvatar = useCallback(async () => {
        const res = await launchImageLibrary({ mediaType: 'photo', quality: 0.8, selectionLimit: 1, includeBase64: true });
        if (res.didCancel || res.errorCode) return;
        const asset = res.assets?.[0];
        if (!asset?.uri) return;

        setUploading(true);
        try {
            const result = await uploadAvatar(asset);
            const url = result.profile_picture;
            setProfile(prev => ({ ...prev, profile_picture: `${url}?t=${Date.now()}` }));
            await updateUser({ profile_picture: url });
            showToast('Profile photo updated!', 'success');
        } catch {
            showToast('Failed to upload photo. Try again.', 'error');
            setProfile(prev => ({ ...prev, profile_picture: null }));
        } finally {
            setUploading(false);
        }
    }, [showToast]);

    const styles   = makeStyles(theme);

    const inputStyle = [styles.fieldInput, { color: theme.text }];

    return (
        <ScreenWrapper title="Edit Profile" showBack>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* ── Avatar header ──────────────────────────────────────── */}
                    <View style={styles.avatarHeader}>
                        <Avatar
                            name={profile.name}
                            photoUri={profile.profile_picture}
                            size={80}
                            editable
                            uploading={uploading}
                            onPress={handlePickAvatar}
                        />
                        <Text style={[styles.avatarName, { marginTop: 12 }]}>{profile.name || 'Your Name'}</Text>
                        <Text style={styles.avatarSub}>Client</Text>
                    </View>

                    {/* ── Personal ───────────────────────────────────────────── */}
                    <Text style={styles.sectionLabel}>Personal</Text>
                    <View style={styles.card}>
                        <FieldRow label="Name" last={false} styles={styles}>
                            <TextInput
                                style={inputStyle}
                                value={profile.name}
                                onChangeText={set('name')}
                                placeholderTextColor={theme.placeholder}
                                returnKeyType="next"
                            />
                        </FieldRow>
                        <FieldRow label="Email" last={false} styles={styles}>
                            <TextInput
                                style={[...inputStyle, styles.fieldInputDisabled]}
                                value={profile.email}
                                editable={false}
                                placeholderTextColor={theme.placeholder}
                            />
                        </FieldRow>
                        <FieldRow label="Age" last={false} styles={styles}>
                            <TextInput
                                style={inputStyle}
                                value={profile.age}
                                onChangeText={set('age')}
                                keyboardType="number-pad"
                                placeholder="e.g. 28"
                                placeholderTextColor={theme.placeholder}
                            />
                        </FieldRow>
                        <FieldRow label="Gender" last={true} styles={styles}>
                            <TextInput
                                style={inputStyle}
                                value={profile.gender}
                                onChangeText={set('gender')}
                                placeholder="e.g. Male, Female"
                                placeholderTextColor={theme.placeholder}
                                returnKeyType="next"
                            />
                        </FieldRow>
                    </View>

                    {/* ── Health & Fitness ───────────────────────────────────── */}
                    <Text style={styles.sectionLabel}>Health & Fitness</Text>
                    <View style={styles.card}>
                        <View style={[styles.multiRow, styles.fieldRowBorder]}>
                            <Text style={styles.multiLabel}>Fitness Goals</Text>
                            <TextInput
                                style={[styles.multiInput, { color: theme.text }]}
                                value={profile.fitness_goals}
                                onChangeText={set('fitness_goals')}
                                placeholder="What are you working towards?"
                                placeholderTextColor={theme.placeholder}
                                multiline
                                textAlignVertical="top"
                            />
                        </View>
                        <View style={styles.multiRow}>
                            <Text style={styles.multiLabel}>Medical Conditions</Text>
                            <TextInput
                                style={[styles.multiInput, { color: theme.text }]}
                                value={profile.medical_conditions}
                                onChangeText={set('medical_conditions')}
                                placeholder="Any conditions your trainer should know about"
                                placeholderTextColor={theme.placeholder}
                                multiline
                                textAlignVertical="top"
                            />
                        </View>
                    </View>

                    {/* ── Save ───────────────────────────────────────────────── */}
                    <TouchableOpacity
                        style={[styles.saveBtn, saving && styles.saveBtnDisabled, { backgroundColor: theme.accent }]}
                        onPress={handleSave}
                        disabled={saving}
                        activeOpacity={0.82}
                    >
                        <Icon name="checkmark-outline" size={18} color="#fff" />
                        <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save Changes'}</Text>
                    </TouchableOpacity>

                    {/* ── Preferences ────────────────────────────────────────── */}
                    <Text style={styles.sectionLabel}>Preferences</Text>
                    <View style={styles.card}>
                        <View style={styles.toggleRow}>
                            <View style={styles.toggleInfo}>
                                <Icon name={isDark ? 'moon' : 'sunny-outline'} size={18} color={theme.textSecondary} style={{ marginRight: 10 }} />
                                <Text style={styles.toggleLabel}>Dark Mode</Text>
                            </View>
                            <Switch
                                value={isDark}
                                onValueChange={toggleTheme}
                                trackColor={{ false: theme.border, true: theme.accent }}
                                thumbColor="#fff"
                            />
                        </View>
                    </View>

                    {/* ── Account ────────────────────────────────────────────── */}
                    <Text style={styles.sectionLabel}>Account</Text>
                    <TouchableOpacity
                        style={styles.logoutBtn}
                        onPress={handleLogout}
                        activeOpacity={0.78}
                    >
                        <Icon name="log-out-outline" size={18} color="#ef4444" />
                        <Text style={styles.logoutBtnText}>Log Out</Text>
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
};

// ── Styles ─────────────────────────────────────────────────────────────────────

const makeStyles = (theme) => StyleSheet.create({
    scroll: {
        padding: 16,
        paddingBottom: 48,
        backgroundColor: theme.background,
    },

    // Avatar header
    avatarHeader: {
        alignItems: 'center',
        paddingVertical: 24,
        marginBottom: 8,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
    },
    avatarText: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '800',
    },
    avatarName: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.text,
    },
    avatarSub: {
        fontSize: 13,
        color: theme.textMuted,
        marginTop: 2,
    },

    // Section label
    sectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: theme.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 8,
        marginTop: 20,
        paddingLeft: 4,
    },

    // Card
    card: {
        backgroundColor: theme.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.border,
        overflow: 'hidden',
    },

    // Inline field rows
    fieldRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 4,
        minHeight: 52,
    },
    fieldRowBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.border,
    },
    fieldLabel: {
        width: 80,
        fontSize: 14,
        fontWeight: '600',
        color: theme.textSecondary,
        flexShrink: 0,
    },
    fieldInput: {
        flex: 1,
        fontSize: 15,
        paddingVertical: 10,
        textAlign: 'right',
    },
    fieldInputDisabled: {
        opacity: 0.45,
    },

    // Multiline rows
    multiRow: {
        padding: 16,
    },
    multiLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    multiInput: {
        fontSize: 15,
        minHeight: 72,
        textAlignVertical: 'top',
        lineHeight: 21,
    },

    // Save button
    saveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 24,
        paddingVertical: 15,
        borderRadius: 14,
    },
    saveBtnDisabled: {
        opacity: 0.6,
    },
    saveBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },

    // Toggle
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    toggleInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    toggleLabel: {
        fontSize: 15,
        color: theme.text,
        fontWeight: '500',
    },

    // Logout
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 15,
        borderRadius: 14,
        backgroundColor: '#ef444418',
        borderWidth: 1,
        borderColor: '#ef444430',
    },
    logoutBtnText: {
        color: '#ef4444',
        fontSize: 15,
        fontWeight: '700',
    },
});

export default ClientProfileEditScreen;
