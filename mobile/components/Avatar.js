import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../src/theme';

const AVATAR_COLORS = ['#6366f1', '#f43f5e', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];

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

const Avatar = ({
    name = '',
    photoUri,
    size = 80,
    editable = false,
    onPress,
    uploading = false,
    borderWidth,
    borderColor,
    style,
    backgroundColor,
}) => {
    const { theme } = useTheme();
    const [imgError, setImgError] = useState(false);
    useEffect(() => { setImgError(false); }, [photoUri]);

    const showPhoto = !!photoUri && !imgError;
    const bg = backgroundColor ?? avatarColor(name);
    const initials = getInitials(name);
    const badgeSize = Math.round(size * 0.3);

    const circleStyle = {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        ...(borderWidth ? { borderWidth, borderColor } : {}),
    };

    const circle = showPhoto ? (
        <Image
            source={{ uri: photoUri }}
            style={circleStyle}
            onError={() => setImgError(true)}
        />
    ) : (
        <View style={[circleStyle, { alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ color: '#fff', fontSize: Math.round(size * 0.34), fontWeight: '800' }}>
                {initials}
            </Text>
        </View>
    );

    const wrapped = (
        <View style={[{
            width: size,
            height: size,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.15,
            shadowRadius: 6,
            elevation: 4,
        }, style]}>
            {circle}
            {editable && (
                <View style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: badgeSize,
                    height: badgeSize,
                    borderRadius: badgeSize / 2,
                    backgroundColor: uploading ? theme.textMuted : theme.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: theme.card,
                }}>
                    <Icon
                        name={uploading ? 'ellipsis-horizontal' : 'camera'}
                        size={Math.round(badgeSize * 0.52)}
                        color="#fff"
                    />
                </View>
            )}
        </View>
    );

    if (!editable) return wrapped;

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8} disabled={uploading}>
            {wrapped}
        </TouchableOpacity>
    );
};

export { avatarColor, getInitials };
export default Avatar;
