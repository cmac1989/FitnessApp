import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, StyleSheet,
    TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { getClients } from '../../src/api/user';
import { trainerBatchCreateCheckIns } from '../../src/api/checkin';
import { useTheme } from '../../src/theme';

// ── Helpers ───────────────────────────────────────────────────────────────────

const AVATAR_COLORS = ['#6366f1', '#f43f5e', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

const avatarColor = (name = '') => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const getInitials = (name = '') => {
    const parts = name.trim().split(' ');
    return parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : name.substring(0, 2).toUpperCase();
};

const getThisWeekLabel = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return `Week of ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
};

// ── Main Screen ───────────────────────────────────────────────────────────────

const TrainerCheckInFormScreen = () => {
    const navigation = useNavigation();
    const { theme } = useTheme();
    const styles = makeStyles(theme);

    const [clients, setClients]               = useState([]);
    const [clientsLoading, setClientsLoading] = useState(true);
    const [selectedIds, setSelectedIds]       = useState(new Set());
    const [saving, setSaving]                 = useState(false);

    useEffect(() => {
        getClients()
            .then(data => setClients(data || []))
            .catch(() => setClients([]))
            .finally(() => setClientsLoading(false));
    }, []);

    const toggleClient = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        if (selectedIds.size === clients.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(clients.map(c => c.id)));
        }
    };

    const handleAssign = async () => {
        if (selectedIds.size === 0) {
            Alert.alert('Select Clients', 'Please choose at least one client.');
            return;
        }
        if (saving) return;
        setSaving(true);
        try {
            const res = await trainerBatchCreateCheckIns([...selectedIds]);
            navigation.goBack();
            if (res.skipped > 0) {
                Alert.alert('Done', res.message);
            }
        } catch (err) {
            const msg = err?.response?.data?.message ?? 'Could not assign check-ins. Please try again.';
            Alert.alert('Error', msg);
        } finally {
            setSaving(false);
        }
    };

    const allSelected = clients.length > 0 && selectedIds.size === clients.length;

    return (
        <ScreenWrapper title="Assign Check-ins" showBack>
            <ScrollView
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
            >
                {/* Week badge */}
                <View style={styles.weekBadge}>
                    <Text style={styles.weekBadgeText}>📅  {getThisWeekLabel()}</Text>
                </View>

                <Text style={styles.description}>
                    Select one or more clients to assign this week's check-in. They'll be notified and can fill in their weight, energy, and notes. Workout compliance is calculated automatically.
                </Text>

                {/* Client selector */}
                <View style={styles.sectionRow}>
                    <Text style={styles.sectionLabel}>SELECT CLIENTS</Text>
                    {!clientsLoading && clients.length > 0 && (
                        <TouchableOpacity onPress={toggleAll} activeOpacity={0.7}>
                            <Text style={styles.selectAllText}>
                                {allSelected ? 'Deselect All' : 'Select All'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                {clientsLoading ? (
                    <ActivityIndicator color={theme.accent} style={{ marginVertical: 16 }} />
                ) : clients.length === 0 ? (
                    <Text style={styles.noClientsText}>No clients linked yet.</Text>
                ) : (
                    <View style={styles.clientList}>
                        {clients.map((c, index) => {
                            const selected = selectedIds.has(c.id);
                            const bg = avatarColor(c.name);
                            return (
                                <TouchableOpacity
                                    key={c.id}
                                    style={[
                                        styles.clientRow,
                                        index < clients.length - 1 && styles.clientRowBorder,
                                        selected && styles.clientRowSelected,
                                    ]}
                                    onPress={() => toggleClient(c.id)}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.avatar, { backgroundColor: bg }]}>
                                        <Text style={styles.avatarText}>{getInitials(c.name)}</Text>
                                    </View>
                                    <View style={styles.clientRowInfo}>
                                        <Text style={[styles.clientRowName, selected && styles.clientRowNameSelected]}>
                                            {c.name}
                                        </Text>
                                        <Text style={styles.clientRowEmail}>{c.email}</Text>
                                    </View>
                                    <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                                        {selected && <Text style={styles.checkboxCheck}>✓</Text>}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

                {/* Assign button */}
                <TouchableOpacity
                    style={[styles.assignBtn, (selectedIds.size === 0 || saving) && styles.assignBtnDisabled]}
                    onPress={handleAssign}
                    disabled={selectedIds.size === 0 || saving}
                    activeOpacity={0.85}
                >
                    <Text style={styles.assignBtnText}>
                        {saving
                            ? 'Assigning…'
                            : selectedIds.size === 0
                                ? 'Assign Check-in'
                                : `Assign to ${selectedIds.size} ${selectedIds.size === 1 ? 'Client' : 'Clients'}`}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </ScreenWrapper>
    );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const makeStyles = (theme) => StyleSheet.create({
    container: {
        padding: 20,
        paddingBottom: 48,
        backgroundColor: theme.background,
    },

    weekBadge: {
        backgroundColor: theme.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.border,
        paddingHorizontal: 14,
        paddingVertical: 10,
        alignSelf: 'flex-start',
        marginBottom: 16,
    },
    weekBadgeText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.textSecondary,
    },

    description: {
        fontSize: 14,
        color: theme.textSecondary,
        lineHeight: 20,
        marginBottom: 24,
    },

    sectionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: theme.textMuted,
        letterSpacing: 0.8,
    },
    selectAllText: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.primary,
    },

    noClientsText: {
        fontSize: 15,
        color: theme.textSecondary,
        fontStyle: 'italic',
    },

    clientList: {
        backgroundColor: theme.card,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.border,
        overflow: 'hidden',
        marginBottom: 8,
    },
    clientRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 14,
        gap: 12,
    },
    clientRowBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.border,
    },
    clientRowSelected: {
        backgroundColor: theme.primary + '0e',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    avatarText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    clientRowInfo: {
        flex: 1,
    },
    clientRowName: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.text,
    },
    clientRowNameSelected: {
        color: theme.primary,
    },
    clientRowEmail: {
        fontSize: 12,
        color: theme.textMuted,
        marginTop: 1,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: theme.border,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    checkboxSelected: {
        backgroundColor: theme.primary,
        borderColor: theme.primary,
    },
    checkboxCheck: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },

    assignBtn: {
        backgroundColor: theme.primary,
        borderRadius: 14,
        paddingVertical: 17,
        alignItems: 'center',
        marginTop: 24,
    },
    assignBtnDisabled: {
        opacity: 0.45,
    },
    assignBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});

export default TrainerCheckInFormScreen;
