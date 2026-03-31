import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const WEEK_DAYS  = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

// Always use local-time YMD to avoid UTC-shift issues
export const toYMD = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

/**
 * WorkoutCalendar
 *
 * Props:
 *   markedDates  – { 'YYYY-MM-DD': string[] }  array of dot hex colors per day
 *   selectedDate – 'YYYY-MM-DD' | null
 *   onSelectDate – (ymd: string) => void
 *   minDate      – 'YYYY-MM-DD' | null  days before this are dimmed & not tappable
 *   theme        – theme object from useTheme()
 *   style        – optional ViewStyle override for the outer container
 */
const WorkoutCalendar = ({
    markedDates  = {},
    selectedDate = null,
    onSelectDate,
    minDate      = null,
    theme,
    style,
}) => {
    const today = toYMD(new Date());

    const [viewYear,  setViewYear]  = useState(new Date().getFullYear());
    const [viewMonth, setViewMonth] = useState(new Date().getMonth()); // 0-indexed

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
        else setViewMonth(m => m - 1);
    };

    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
        else setViewMonth(m => m + 1);
    };

    // Build flat cell array [null = padding, 'YYYY-MM-DD' = real day]
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    const daysInMonth     = new Date(viewYear, viewMonth + 1, 0).getDate();
    const startPad        = firstDayOfMonth.getDay(); // 0 = Sunday

    const cells = [];
    for (let i = 0; i < startPad; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
        cells.push(
            `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        );
    }
    while (cells.length % 7 !== 0) cells.push(null);

    const weeks = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

    const styles = makeStyles(theme);

    return (
        <View style={[styles.container, style]}>

            {/* ── Month header ── */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={prevMonth}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    style={styles.navBtn}
                >
                    <Icon name="chevron-back" size={20} color={theme.text} />
                </TouchableOpacity>

                <Text style={styles.monthTitle}>
                    {MONTH_NAMES[viewMonth]} {viewYear}
                </Text>

                <TouchableOpacity
                    onPress={nextMonth}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    style={styles.navBtn}
                >
                    <Icon name="chevron-forward" size={20} color={theme.text} />
                </TouchableOpacity>
            </View>

            {/* ── Day-name row ── */}
            <View style={styles.weekRow}>
                {WEEK_DAYS.map(d => (
                    <View key={d} style={styles.cell}>
                        <Text style={styles.weekDayName}>{d}</Text>
                    </View>
                ))}
            </View>

            {/* ── Calendar grid ── */}
            {weeks.map((week, wi) => (
                <View key={wi} style={styles.weekRow}>
                    {week.map((ymd, ci) => {
                        if (!ymd) return <View key={ci} style={styles.cell} />;

                        const isToday    = ymd === today;
                        const isSelected = ymd === selectedDate;
                        const isPast     = ymd < today;
                        const isDisabled = minDate ? ymd < minDate : false;
                        const dots       = markedDates[ymd] ?? [];

                        return (
                            <TouchableOpacity
                                key={ymd}
                                style={styles.cell}
                                onPress={() => !isDisabled && onSelectDate?.(ymd)}
                                activeOpacity={isDisabled ? 1 : 0.65}
                            >
                                <View style={[
                                    styles.dayCircle,
                                    isToday && !isSelected && styles.circleToday,
                                    isSelected && styles.circleSelected,
                                ]}>
                                    <Text style={[
                                        styles.dayNumber,
                                        (isPast || isDisabled) && !isSelected && styles.numPast,
                                        isToday && !isSelected && styles.numToday,
                                        isSelected && styles.numSelected,
                                    ]}>
                                        {parseInt(ymd.slice(8), 10)}
                                    </Text>
                                </View>

                                {dots.length > 0 && (
                                    <View style={styles.dotsRow}>
                                        {dots.slice(0, 3).map((color, i) => (
                                            <View key={i} style={[styles.dot, { backgroundColor: color }]} />
                                        ))}
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            ))}
        </View>
    );
};

const makeStyles = (theme) => StyleSheet.create({
    container: {
        backgroundColor: theme.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.border,
        paddingHorizontal: 4,
        paddingBottom: 10,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 8,
    },
    navBtn: {
        padding: 4,
    },
    monthTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.text,
        letterSpacing: 0.2,
    },
    weekRow: {
        flexDirection: 'row',
    },
    cell: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 2,
        minHeight: 46,
        justifyContent: 'center',
    },
    weekDayName: {
        fontSize: 11,
        fontWeight: '700',
        color: theme.textMuted,
        letterSpacing: 0.3,
    },
    dayCircle: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
    },
    circleToday: {
        borderWidth: 1.5,
        borderColor: theme.accent,
    },
    circleSelected: {
        backgroundColor: theme.accent,
    },
    dayNumber: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.text,
    },
    numPast: {
        color: theme.textMuted,
        opacity: 0.55,
    },
    numToday: {
        color: theme.accent,
        fontWeight: '700',
    },
    numSelected: {
        color: '#fff',
        fontWeight: '700',
    },
    dotsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 2,
        marginTop: 2,
    },
    dot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
    },
});

export default WorkoutCalendar;
