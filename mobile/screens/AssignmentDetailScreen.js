import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
    ActivityIndicator, Alert,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import ScreenWrapper from '../components/ScreenWrapper';
import {
    getAssignment, toggleLike, getComments, addComment, toggleComplete,
    deleteComment, toggleCommentLike,
} from '../src/api/assignment';
import { useTheme } from '../src/theme';

const formatDate = (iso) => {
    if (!iso) return null;
    const d = new Date(iso + (iso.length === 10 ? 'T12:00:00' : ''));
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

const formatTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
        d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

const AssignmentDetailScreen = () => {
    const route = useRoute();
    const { assignment: initialAssignment, role } = route.params;
    const { theme } = useTheme();
    const styles = makeStyles(theme);

    const [assignment, setAssignment]   = useState(initialAssignment);
    const [likedByMe, setLikedByMe]     = useState(initialAssignment.liked_by_me ?? false);
    const [likeCount, setLikeCount]     = useState(initialAssignment.like_count ?? 0);
    const [completedAt, setCompletedAt] = useState(initialAssignment.completed_at ?? null);
    const [comments, setComments]       = useState([]);
    const [commentText, setCommentText] = useState('');
    const [loadingData, setLoadingData] = useState(true);
    const [submitting, setSubmitting]   = useState(false);
    const [toggling, setToggling]       = useState(false);
    const [completing, setCompleting]   = useState(false);
    const [showCommentInput, setShowCommentInput] = useState(false);

    const scrollRef = useRef(null);

    const workout = assignment.workout || {};

    // Current user's ID derived from the assignment parties
    const myId = role === 'client'
        ? (assignment?.client?.id ?? null)
        : (assignment?.trainer?.id ?? null);

    const loadAll = useCallback(async () => {
        try {
            const [detail, commentData] = await Promise.all([
                getAssignment(role, assignment.id),
                getComments(role, assignment.id),
            ]);
            setAssignment(detail.assignment);
            setLikedByMe(detail.assignment.liked_by_me);
            setLikeCount(detail.assignment.like_count);
            setCompletedAt(detail.assignment.completed_at);
            setComments(commentData.comments || []);
        } catch {
            // Keep initial data on error
        } finally {
            setLoadingData(false);
        }
    }, [role, assignment.id]);

    useEffect(() => {
        loadAll();
    }, [loadAll]);

    const handleToggleLike = async () => {
        if (toggling) return;
        setToggling(true);
        // Optimistic
        setLikedByMe((v) => !v);
        setLikeCount((n) => likedByMe ? n - 1 : n + 1);
        try {
            const res = await toggleLike(role, assignment.id);
            setLikedByMe(res.liked);
            setLikeCount(res.like_count);
        } catch {
            // Revert
            setLikedByMe((v) => !v);
            setLikeCount((n) => likedByMe ? n + 1 : n - 1);
        } finally {
            setToggling(false);
        }
    };

    const handleToggleComplete = async () => {
        if (completing) return;
        setCompleting(true);
        try {
            const res = await toggleComplete(assignment.id);
            setCompletedAt(res.completed_at);
        } catch {
            Alert.alert('Error', 'Could not update completion status.');
        } finally {
            setCompleting(false);
        }
    };

    const handleAddComment = async () => {
        const body = commentText.trim();
        if (!body || submitting) return;
        setSubmitting(true);
        try {
            const res = await addComment(role, assignment.id, body);
            setComments((prev) => [...prev, { ...res.comment, like_count: 0, liked_by_me: false }]);
            setCommentText('');
            setShowCommentInput(false);
            setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
        } catch {
            Alert.alert('Error', 'Could not post comment.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteComment = (commentId) => {
        Alert.alert(
            'Delete Comment',
            'Are you sure you want to delete this comment?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteComment(role, assignment.id, commentId);
                            setComments((prev) => prev.filter((c) => c.id !== commentId));
                        } catch {
                            Alert.alert('Error', 'Could not delete comment.');
                        }
                    },
                },
            ]
        );
    };

    const handleToggleCommentLike = async (commentId) => {
        // Optimistic update
        setComments((prev) =>
            prev.map((c) => {
                if (c.id !== commentId) return c;
                const wasLiked = c.liked_by_me;
                return {
                    ...c,
                    liked_by_me: !wasLiked,
                    like_count: wasLiked ? c.like_count - 1 : c.like_count + 1,
                };
            })
        );
        try {
            const res = await toggleCommentLike(role, assignment.id, commentId);
            setComments((prev) =>
                prev.map((c) =>
                    c.id === commentId
                        ? { ...c, liked_by_me: res.liked, like_count: res.like_count }
                        : c
                )
            );
        } catch {
            // Revert optimistic update
            setComments((prev) =>
                prev.map((c) => {
                    if (c.id !== commentId) return c;
                    const wasLiked = c.liked_by_me;
                    return {
                        ...c,
                        liked_by_me: !wasLiked,
                        like_count: wasLiked ? c.like_count - 1 : c.like_count + 1,
                    };
                })
            );
        }
    };

    const isCompleted = !!completedAt;

    if (loadingData) {
        return (
            <ScreenWrapper title={workout.title || 'Workout'} showBack>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={theme.accent} />
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper title={workout.title || 'Workout'} showBack>
                <ScrollView
                    ref={scrollRef}
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* ── Workout info card ── */}
                    <View style={[styles.card, isCompleted && styles.cardCompleted]}>
                        <View style={styles.cardTitleRow}>
                            <Text style={styles.workoutTitle}>{workout.title}</Text>
                            {isCompleted && (
                                <View style={styles.completedBadge}>
                                    <Text style={styles.completedBadgeText}>Done</Text>
                                </View>
                            )}
                        </View>

                        {assignment.scheduled_date && (
                            <Text style={styles.scheduledDate}>
                                {formatDate(assignment.scheduled_date)}
                            </Text>
                        )}

                        {workout.difficulty && (
                            <View style={styles.fieldRow}>
                                <Text style={styles.fieldLabel}>Difficulty</Text>
                                <Text style={styles.fieldValue}>{workout.difficulty}</Text>
                            </View>
                        )}
                        {workout.duration && (
                            <View style={styles.fieldRow}>
                                <Text style={styles.fieldLabel}>Duration</Text>
                                <Text style={styles.fieldValue}>{workout.duration} min</Text>
                            </View>
                        )}
                        {workout.description && (
                            <View style={styles.fieldRow}>
                                <Text style={styles.fieldLabel}>Description</Text>
                                <Text style={styles.fieldValue}>{workout.description}</Text>
                            </View>
                        )}
                        {workout.workout_list && (
                            <View style={styles.fieldRow}>
                                <Text style={styles.fieldLabel}>Exercises</Text>
                                <Text style={styles.fieldValue}>{workout.workout_list}</Text>
                            </View>
                        )}

                        {/* Client name for trainer view */}
                        {role === 'trainer' && assignment.client?.name && (
                            <View style={styles.fieldRow}>
                                <Text style={styles.fieldLabel}>Client</Text>
                                <Text style={styles.fieldValue}>{assignment.client.name}</Text>
                            </View>
                        )}
                    </View>

                    {/* ── Actions: complete + like ── */}
                    <View style={styles.actionsRow}>
                        {role === 'client' && (
                            <TouchableOpacity
                                style={[
                                    styles.actionBtn,
                                    isCompleted ? styles.actionBtnCompleted : styles.actionBtnDefault,
                                ]}
                                onPress={handleToggleComplete}
                                disabled={completing}
                                activeOpacity={0.8}
                            >
                                {completing ? (
                                    <ActivityIndicator color={isCompleted ? '#16a34a' : theme.textSecondary} size="small" />
                                ) : (
                                    <Text style={[
                                        styles.actionBtnText,
                                        isCompleted ? styles.actionBtnTextCompleted : styles.actionBtnTextDefault,
                                    ]}>
                                        {isCompleted ? 'Completed' : 'Mark Complete'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={[
                                styles.likeBtn,
                                likedByMe && styles.likeBtnActive,
                            ]}
                            onPress={handleToggleLike}
                            disabled={toggling}
                            activeOpacity={0.75}
                        >
                            <Text style={[styles.likeHeart, likedByMe && styles.likeHeartActive]}>
                                {likedByMe ? '\u2665' : '\u2661'}
                            </Text>
                            <Text style={[styles.likeCount, likedByMe && styles.likeCountActive]}>
                                {likeCount}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* ── Comments ── */}
                    <Text style={styles.sectionTitle}>
                        Comments ({comments.length})
                    </Text>

                    {comments.length === 0 ? (
                        <Text style={styles.emptyComments}>
                            No comments yet. Be the first to say something!
                        </Text>
                    ) : (
                        comments.map((c) => (
                            <View key={c.id} style={styles.commentBubble}>
                                <View style={styles.commentHeader}>
                                    <Text style={styles.commentAuthor}>{c.user_name}</Text>
                                    <Text style={styles.commentTime}>{formatTime(c.created_at)}</Text>
                                </View>
                                <Text style={styles.commentBody}>{c.body}</Text>
                                <View style={styles.commentActions}>
                                    <TouchableOpacity
                                        style={styles.commentActionBtn}
                                        onPress={() => handleToggleCommentLike(c.id)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[
                                            styles.commentActionText,
                                            c.liked_by_me && styles.commentLikedText,
                                        ]}>
                                            {c.liked_by_me ? '\u2665' : '\u2661'}{c.like_count > 0 ? ` ${c.like_count}` : ''}
                                        </Text>
                                    </TouchableOpacity>

                                    {myId !== null && c.user_id === myId && (
                                        <TouchableOpacity
                                            style={styles.commentActionBtn}
                                            onPress={() => handleDeleteComment(c.id)}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={styles.commentDeleteText}>Delete</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        ))
                    )}

                    {/* ── Inline comment input ── */}
                    {showCommentInput ? (
                        <View style={styles.inlineInputWrap}>
                            <TextInput
                                style={styles.input}
                                value={commentText}
                                onChangeText={setCommentText}
                                placeholder="Write a comment..."
                                placeholderTextColor={theme.textMuted}
                                multiline
                                maxLength={1000}
                                autoFocus
                            />
                            <View style={styles.inlineInputRow}>
                                <TouchableOpacity onPress={() => { setShowCommentInput(false); setCommentText(''); }} activeOpacity={0.7}>
                                    <Text style={[styles.commentActionText, { color: theme.textMuted }]}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.sendBtn, (!commentText.trim() || submitting) && styles.sendBtnDisabled]}
                                    onPress={handleAddComment}
                                    disabled={!commentText.trim() || submitting}
                                    activeOpacity={0.75}
                                >
                                    {submitting ? (
                                        <ActivityIndicator color="#fff" size="small" />
                                    ) : (
                                        <Text style={styles.sendBtnText}>Send</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={styles.writeCommentBtn}
                            onPress={() => setShowCommentInput(true)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.writeCommentText}>Write a comment...</Text>
                        </TouchableOpacity>
                    )}

                    <View style={{ height: 30 }} />
                </ScrollView>
        </ScreenWrapper>
    );
};

const makeStyles = (theme) => StyleSheet.create({
    scroll: {
        flex: 1,
        backgroundColor: theme.background,
    },
    scrollContent: {
        padding: 20,
    },
    // ── Workout card ──
    card: {
        backgroundColor: theme.card,
        borderRadius: 14,
        padding: 18,
        borderWidth: 1,
        borderColor: theme.border,
        marginBottom: 14,
    },
    cardCompleted: {
        borderColor: '#22c55e',
    },
    cardTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    workoutTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.text,
        flex: 1,
        marginRight: 8,
    },
    completedBadge: {
        backgroundColor: '#22c55e22',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    completedBadgeText: {
        color: '#16a34a',
        fontSize: 12,
        fontWeight: '700',
    },
    scheduledDate: {
        fontSize: 13,
        color: theme.textMuted,
        marginBottom: 14,
    },
    fieldRow: {
        marginTop: 12,
    },
    fieldLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: theme.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 3,
    },
    fieldValue: {
        fontSize: 15,
        color: theme.text,
        lineHeight: 22,
    },
    // ── Actions ──
    actionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 24,
    },
    actionBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 1.5,
    },
    actionBtnDefault: {
        borderColor: theme.border,
        backgroundColor: theme.card,
    },
    actionBtnCompleted: {
        borderColor: '#22c55e',
        backgroundColor: '#22c55e18',
    },
    actionBtnText: {
        fontSize: 14,
        fontWeight: '700',
    },
    actionBtnTextDefault: {
        color: theme.textSecondary,
    },
    actionBtnTextCompleted: {
        color: '#16a34a',
    },
    likeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: theme.border,
        backgroundColor: theme.card,
    },
    likeBtnActive: {
        borderColor: '#ef4444',
        backgroundColor: '#ef444412',
    },
    likeHeart: {
        fontSize: 20,
        color: theme.textSecondary,
    },
    likeHeartActive: {
        color: '#ef4444',
    },
    likeCount: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.textSecondary,
    },
    likeCountActive: {
        color: '#ef4444',
    },
    // ── Comments ──
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.text,
        marginBottom: 12,
    },
    emptyComments: {
        fontSize: 14,
        color: theme.textMuted,
        fontStyle: 'italic',
        textAlign: 'center',
        marginVertical: 20,
    },
    commentBubble: {
        backgroundColor: theme.card,
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: theme.border,
    },
    commentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    commentAuthor: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.accent,
    },
    commentTime: {
        fontSize: 11,
        color: theme.textMuted,
    },
    commentBody: {
        fontSize: 14,
        color: theme.text,
        lineHeight: 20,
        marginBottom: 8,
    },
    commentActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        borderTopWidth: 1,
        borderTopColor: theme.border,
        paddingTop: 6,
    },
    commentActionBtn: {
        paddingVertical: 2,
    },
    commentActionText: {
        fontSize: 13,
        color: theme.textMuted,
        fontWeight: '500',
    },
    commentLikedText: {
        color: '#ef4444',
        fontWeight: '700',
    },
    commentDeleteText: {
        fontSize: 13,
        color: theme.error,
        fontWeight: '500',
    },
    // ── Inline comment input ──
    writeCommentBtn: {
        marginTop: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.card,
    },
    writeCommentText: {
        fontSize: 14,
        color: theme.textMuted,
    },
    inlineInputWrap: {
        marginTop: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.card,
        padding: 10,
        gap: 8,
    },
    inlineInputRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 10,
        marginTop: 6,
    },
    input: {
        backgroundColor: theme.background,
        borderWidth: 1,
        borderColor: theme.inputBorder || theme.border,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 15,
        color: theme.text,
        maxHeight: 100,
    },
    sendBtn: {
        backgroundColor: theme.accent,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    sendBtnDisabled: {
        opacity: 0.4,
    },
    sendBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
});

export default AssignmentDetailScreen;
