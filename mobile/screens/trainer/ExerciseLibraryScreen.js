import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    ScrollView, FlatList, Image, ActivityIndicator, Modal,
    SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import ScreenWrapper from '../../components/ScreenWrapper';
import { getBodyParts, searchExercises } from '../../src/api/exerciseLibrary';
import { deliverExercise, clearExerciseCallback } from '../../src/utils/exerciseSelection';
import { useTheme } from '../../src/theme';

const PAGE_SIZE = 20;
const capitalize = (s = '') => s.charAt(0).toUpperCase() + s.slice(1);

// ── ExerciseLibraryScreen ──────────────────────────────────────────────────────
// Props via route.params:
//   selectionMode (bool)  — show "Add" buttons; after configure, navigates back
//   returnTo    (string)  — screen name to navigate back to with selectedExercise

const ExerciseLibraryScreen = () => {
    const navigation    = useNavigation();
    const route         = useRoute();
    const { theme }     = useTheme();
    const styles        = makeStyles(theme);

    const selectionMode = route.params?.selectionMode ?? false;

    const [bodyParts, setBodyParts]             = useState([]);
    const [selectedBodyPart, setSelectedBodyPart] = useState(null);
    const [searchText, setSearchText]           = useState('');
    const [committed, setCommitted]             = useState('');
    const [exercises, setExercises]             = useState([]);
    const [loading, setLoading]                 = useState(false);
    const [loadingMore, setLoadingMore]         = useState(false);
    const [hasMore, setHasMore]                 = useState(true);

    // Detail / configure modal
    const [detailExercise, setDetailExercise]   = useState(null);
    const [detailMode, setDetailMode]           = useState('view'); // 'view' | 'configure'
    const [sets, setSets]                       = useState('3');
    const [reps, setReps]                       = useState('10');

    const offsetRef = useRef(0);

    // Load body parts once on mount; clear callback on unmount (handles back-without-selecting)
    useEffect(() => {
        getBodyParts()
            .then(parts => setBodyParts(Array.isArray(parts) ? parts.sort() : []))
            .catch(() => {});
        return () => clearExerciseCallback();
    }, []);

    const loadExercises = useCallback(async (reset = false) => {
        if (reset) {
            offsetRef.current = 0;
            setExercises([]);
            setHasMore(true);
        }
        const offset = reset ? 0 : offsetRef.current;
        if (!reset && !hasMore) return;

        try {
            reset ? setLoading(true) : setLoadingMore(true);
            const data = await searchExercises({
                bodyPart: selectedBodyPart || null,
                name:     committed || null,
                limit:    PAGE_SIZE,
                offset,
            });
            const list = Array.isArray(data) ? data : [];
            if (reset) {
                setExercises(list);
            } else {
                setExercises(prev => [...prev, ...list]);
            }
            offsetRef.current = offset + list.length;
            setHasMore(list.length === PAGE_SIZE);
        } catch (e) {
            console.error('ExerciseLibraryScreen.loadExercises', e);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [selectedBodyPart, committed, hasMore]);

    useEffect(() => {
        loadExercises(true);
    }, [selectedBodyPart, committed]);

    const openDetail = (exercise, mode = 'view') => {
        setDetailExercise(exercise);
        setDetailMode(mode);
        setSets('3');
        setReps('10');
    };

    const closeDetail = () => setDetailExercise(null);

    const handleConfirmAdd = () => {
        if (!detailExercise) return;
        const ex = detailExercise;
        deliverExercise({
            external_id:       ex.id,
            name:              ex.name,
            body_part:         ex.bodyPart,
            equipment:         ex.equipment,
            target:            ex.target,
            gif_url:           ex.gifUrl,
            secondary_muscles: ex.secondaryMuscles ?? [],
            instructions:      ex.instructions ?? [],
            sets,
            reps,
        });
        closeDetail();
        navigation.goBack();
    };

    // If the user presses the hardware/gesture back without selecting, clean up
    const handleBack = () => {
        clearExerciseCallback();
        navigation.goBack();
    };

    // ── Body part chip ─────────────────────────────────────────────────────────

    const renderBodyPartChip = (bp) => {
        const active = selectedBodyPart === bp;
        return (
            <TouchableOpacity
                key={bp}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setSelectedBodyPart(active ? null : bp)}
                activeOpacity={0.75}
            >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {capitalize(bp)}
                </Text>
            </TouchableOpacity>
        );
    };

    // ── Exercise card ──────────────────────────────────────────────────────────

    const renderExercise = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => openDetail(item, selectionMode ? 'configure' : 'view')}
            activeOpacity={0.75}
        >
            <ExerciseThumb gifUrl={item.gifUrl} size={72} theme={theme} />
            <View style={styles.cardBody}>
                <Text style={styles.cardName} numberOfLines={2}>
                    {capitalize(item.name)}
                </Text>
                <View style={styles.cardPills}>
                    <View style={[styles.pill, { backgroundColor: theme.accent + '20' }]}>
                        <Text style={[styles.pillText, { color: theme.accent }]}>
                            {item.bodyPart}
                        </Text>
                    </View>
                    <View style={[styles.pill, { backgroundColor: '#6366f120' }]}>
                        <Text style={[styles.pillText, { color: '#6366f1' }]}>
                            {item.target}
                        </Text>
                    </View>
                </View>
                <Text style={styles.cardEquipment} numberOfLines={1}>{item.equipment}</Text>
            </View>
            {selectionMode ? (
                <View style={[styles.addChip, { backgroundColor: theme.accent + '20' }]}>
                    <Icon name="add" size={16} color={theme.accent} />
                </View>
            ) : (
                <Icon name="chevron-forward" size={16} color={theme.textMuted} />
            )}
        </TouchableOpacity>
    );

    // ── Detail / Configure modal ───────────────────────────────────────────────

    const renderModal = () => {
        if (!detailExercise) return null;
        const ex = detailExercise;

        return (
            <Modal visible animationType="slide" transparent onRequestClose={closeDetail}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalSheet}>
                        <View style={styles.modalHandle} />

                        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                            <ExerciseThumb gifUrl={ex.gifUrl} size="full" theme={theme} style={styles.modalGif} />

                            <Text style={styles.modalName}>{capitalize(ex.name)}</Text>

                            <View style={styles.modalPills}>
                                <View style={[styles.pill, { backgroundColor: theme.accent + '20' }]}>
                                    <Text style={[styles.pillText, { color: theme.accent }]}>{ex.bodyPart}</Text>
                                </View>
                                <View style={[styles.pill, { backgroundColor: '#6366f120' }]}>
                                    <Text style={[styles.pillText, { color: '#6366f1' }]}>{ex.target}</Text>
                                </View>
                                <View style={[styles.pill, { backgroundColor: '#f59e0b20' }]}>
                                    <Text style={[styles.pillText, { color: '#f59e0b' }]}>{ex.equipment}</Text>
                                </View>
                            </View>

                            {detailMode === 'configure' && (
                                <View style={styles.configSection}>
                                    <Text style={styles.configSectionLabel}>Configure Sets & Reps</Text>
                                    <View style={styles.configRow}>
                                        <View style={styles.configField}>
                                            <Text style={styles.configLabel}>SETS</Text>
                                            <TextInput
                                                style={styles.configInput}
                                                value={sets}
                                                onChangeText={setSets}
                                                keyboardType="numeric"
                                                placeholder="3"
                                                placeholderTextColor={theme.placeholder}
                                                color={theme.text}
                                            />
                                        </View>
                                        <View style={styles.configField}>
                                            <Text style={styles.configLabel}>REPS</Text>
                                            <TextInput
                                                style={styles.configInput}
                                                value={reps}
                                                onChangeText={setReps}
                                                placeholder="10"
                                                placeholderTextColor={theme.placeholder}
                                                color={theme.text}
                                            />
                                        </View>
                                    </View>
                                </View>
                            )}

                            {Array.isArray(ex.secondaryMuscles) && ex.secondaryMuscles.length > 0 && (
                                <>
                                    <Text style={styles.modalSectionLabel}>Secondary Muscles</Text>
                                    <Text style={styles.modalBodyText}>{ex.secondaryMuscles.join(', ')}</Text>
                                </>
                            )}

                            {Array.isArray(ex.instructions) && ex.instructions.length > 0 && (
                                <>
                                    <Text style={styles.modalSectionLabel}>Instructions</Text>
                                    {ex.instructions.map((step, i) => (
                                        <View key={i} style={styles.instructionRow}>
                                            <View style={[styles.instructionNum, { backgroundColor: theme.accent }]}>
                                                <Text style={styles.instructionNumText}>{i + 1}</Text>
                                            </View>
                                            <Text style={styles.instructionText}>{step}</Text>
                                        </View>
                                    ))}
                                </>
                            )}

                            <View style={{ height: 20 }} />
                        </ScrollView>

                        <View style={styles.modalBtnRow}>
                            <TouchableOpacity style={styles.modalCloseBtn} onPress={closeDetail} activeOpacity={0.8}>
                                <Text style={styles.modalCloseBtnText}>Close</Text>
                            </TouchableOpacity>
                            {detailMode === 'configure' && (
                                <TouchableOpacity
                                    style={[styles.modalCloseBtn, { backgroundColor: theme.accent, flex: 2 }]}
                                    onPress={handleConfirmAdd}
                                    activeOpacity={0.8}
                                >
                                    <Icon name="add" size={16} color="#fff" />
                                    <Text style={[styles.modalCloseBtnText, { color: '#fff' }]}>Add to Workout</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>
            </Modal>
        );
    };

    // ── Main render ───────────────────────────────────────────────────────────

    return (
        <ScreenWrapper
            title={selectionMode ? 'Select Exercise' : 'Exercise Library'}
            showBack={selectionMode}
            onBack={selectionMode ? handleBack : undefined}
        >
            <View style={styles.container}>

                {/* Search bar */}
                <View style={styles.searchRow}>
                    <View style={styles.searchBox}>
                        <Icon name="search" size={16} color={theme.textMuted} style={{ marginRight: 8 }} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search exercises…"
                            placeholderTextColor={theme.placeholder}
                            value={searchText}
                            onChangeText={setSearchText}
                            onSubmitEditing={() => setCommitted(searchText.trim())}
                            returnKeyType="search"
                        />
                        {searchText.length > 0 && (
                            <TouchableOpacity onPress={() => { setSearchText(''); setCommitted(''); }} activeOpacity={0.7}>
                                <Icon name="close-circle" size={16} color={theme.textMuted} />
                            </TouchableOpacity>
                        )}
                    </View>
                    <TouchableOpacity
                        style={[styles.searchBtn, { backgroundColor: theme.accent }]}
                        onPress={() => setCommitted(searchText.trim())}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.searchBtnText}>Go</Text>
                    </TouchableOpacity>
                </View>

                {/* Body part filter chips — fixed height so list doesn't clip them */}
                {bodyParts.length > 0 && (
                    <View style={styles.chipsWrap}>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.chipsContent}
                        >
                            {bodyParts.map(renderBodyPartChip)}
                        </ScrollView>
                    </View>
                )}

                {/* Active filter hint */}
                {(selectedBodyPart || committed) && (
                    <View style={styles.filterHintRow}>
                        <Text style={styles.filterHint}>
                            {[selectedBodyPart && `Body: ${selectedBodyPart}`, committed && `"${committed}"`].filter(Boolean).join('  ·  ')}
                        </Text>
                        <TouchableOpacity onPress={() => { setSelectedBodyPart(null); setSearchText(''); setCommitted(''); }} activeOpacity={0.7}>
                            <Text style={[styles.filterHint, { color: theme.accent }]}>Clear</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Exercise list fills the remaining space */}
                {loading ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color={theme.accent} />
                        <Text style={styles.loadingText}>Loading exercises…</Text>
                    </View>
                ) : (
                    <FlatList
                        data={exercises}
                        keyExtractor={item => item.id ?? item.name}
                        renderItem={renderExercise}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.emptyWrap}>
                                <Icon name="barbell-outline" size={40} color={theme.textMuted} />
                                <Text style={styles.emptyText}>No exercises found</Text>
                                <Text style={styles.emptySubtext}>Try a different search or body part</Text>
                            </View>
                        }
                        ListFooterComponent={
                            hasMore && exercises.length > 0 ? (
                                <TouchableOpacity
                                    style={styles.loadMoreBtn}
                                    onPress={() => loadExercises(false)}
                                    disabled={loadingMore}
                                    activeOpacity={0.8}
                                >
                                    {loadingMore
                                        ? <ActivityIndicator size="small" color={theme.accent} />
                                        : <Text style={styles.loadMoreText}>Load More</Text>
                                    }
                                </TouchableOpacity>
                            ) : null
                        }
                    />
                )}
            </View>

            {renderModal()}
        </ScreenWrapper>
    );
};

// ── ExerciseThumb ──────────────────────────────────────────────────────────────
// Renders the GIF thumbnail with a fallback skeleton while loading.

const ExerciseThumb = ({ gifUrl, size, theme, style }) => {
    const [loaded, setLoaded]   = useState(false);
    const [errored, setErrored] = useState(false);

    const isFullWidth = size === 'full';

    const imgStyle = isFullWidth
        ? [{ width: '100%', height: 220, borderRadius: 14, marginBottom: 16, backgroundColor: theme.border }, style]
        : { width: size, height: size, borderRadius: 10, flexShrink: 0 };

    if (!gifUrl || errored) {
        return (
            <View style={[imgStyle, { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, alignItems: 'center', justifyContent: 'center' }]}>
                <Icon name="barbell-outline" size={isFullWidth ? 40 : 22} color={theme.textMuted} />
            </View>
        );
    }

    return (
        <View style={imgStyle}>
            {!loaded && (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.border, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }]}>
                    <ActivityIndicator size="small" color={theme.textMuted} />
                </View>
            )}
            <Image
                source={{ uri: gifUrl }}
                style={[StyleSheet.absoluteFill, { borderRadius: isFullWidth ? 14 : 10 }]}
                resizeMode="cover"
                onLoad={() => setLoaded(true)}
                onError={() => setErrored(true)}
            />
        </View>
    );
};

// ── Styles ─────────────────────────────────────────────────────────────────────

const makeStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 60,
        gap: 12,
    },
    loadingText: { fontSize: 14, color: theme.textMuted },

    // Search
    searchRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
        gap: 8,
        alignItems: 'center',
    },
    searchBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.border,
        paddingHorizontal: 12,
        paddingVertical: 9,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: theme.text,
        padding: 0,
    },
    searchBtn: {
        paddingHorizontal: 16,
        paddingVertical: 11,
        borderRadius: 12,
    },
    searchBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

    // Chips — fixed-height row so the FlatList doesn't overlap them
    chipsWrap: {
        height: 44,
    },
    chipsContent: {
        paddingHorizontal: 16,
        gap: 8,
        alignItems: 'center',
    },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: theme.card,
        borderWidth: 1,
        borderColor: theme.border,
    },
    chipActive: {
        backgroundColor: theme.accent,
        borderColor: theme.accent,
    },
    chipText: { fontSize: 13, fontWeight: '600', color: theme.textMuted },
    chipTextActive: { color: '#fff' },

    // Filter hint
    filterHintRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 6,
    },
    filterHint: { fontSize: 12, color: theme.textMuted, fontWeight: '500' },

    // Exercise list
    listContent: {
        paddingHorizontal: 16,
        paddingTop: 4,
        paddingBottom: 40,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.card,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.border,
        padding: 10,
        marginBottom: 10,
        gap: 12,
    },
    cardBody: { flex: 1, gap: 4 },
    cardName: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.text,
        lineHeight: 18,
    },
    cardPills: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
    pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    pillText: { fontSize: 11, fontWeight: '600' },
    cardEquipment: { fontSize: 12, color: theme.textMuted },
    addChip: {
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },

    // Empty state
    emptyWrap: { alignItems: 'center', paddingTop: 60, gap: 10 },
    emptyText: { fontSize: 18, fontWeight: '700', color: theme.text },
    emptySubtext: { fontSize: 13, color: theme.textMuted },

    // Load more
    loadMoreBtn: {
        marginVertical: 8,
        paddingVertical: 13,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.card,
        alignItems: 'center',
    },
    loadMoreText: { fontSize: 14, fontWeight: '600', color: theme.accent },

    // Detail / configure modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalSheet: {
        backgroundColor: theme.card,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 8,
        paddingHorizontal: 20,
        maxHeight: '92%',
        paddingBottom: 16,
    },
    modalHandle: {
        width: 36, height: 4, borderRadius: 2,
        backgroundColor: theme.border, alignSelf: 'center', marginBottom: 14,
    },
    modalGif: { marginBottom: 0 }, // overridden by ExerciseThumb full mode
    modalName: { fontSize: 22, fontWeight: '800', color: theme.text, marginBottom: 10 },
    modalPills: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 16 },
    modalSectionLabel: {
        fontSize: 11, fontWeight: '700', color: theme.textMuted,
        textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginTop: 4,
    },
    modalBodyText: { fontSize: 14, color: theme.text, lineHeight: 20, marginBottom: 12 },
    instructionRow: { flexDirection: 'row', gap: 10, marginBottom: 10, alignItems: 'flex-start' },
    instructionNum: {
        width: 22, height: 22, borderRadius: 11,
        alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
    },
    instructionNumText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    instructionText: { flex: 1, fontSize: 14, color: theme.text, lineHeight: 20 },

    // Configure section
    configSection: {
        backgroundColor: theme.background,
        borderRadius: 14,
        padding: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: theme.border,
    },
    configSectionLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.text,
        marginBottom: 12,
    },
    configRow: { flexDirection: 'row', gap: 12 },
    configField: { flex: 1 },
    configLabel: {
        fontSize: 11, fontWeight: '700', color: theme.textMuted,
        letterSpacing: 0.8, marginBottom: 6,
    },
    configInput: {
        backgroundColor: theme.card,
        borderRadius: 10, borderWidth: 1, borderColor: theme.border,
        padding: 12, fontSize: 20, fontWeight: '700',
        color: theme.text, textAlign: 'center',
    },

    // Modal buttons
    modalBtnRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 12,
    },
    modalCloseBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: theme.border,
        borderRadius: 14,
        paddingVertical: 14,
    },
    modalCloseBtnText: { fontSize: 15, fontWeight: '700', color: theme.text },
});

export default ExerciseLibraryScreen;
