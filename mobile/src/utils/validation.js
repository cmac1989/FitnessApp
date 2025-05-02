export const validateRegisterForm = (userInfo) => {
    const errors = {};

    if (!userInfo.name.trim()) {
        errors.name = 'Name is required.';
    }

    if (!userInfo.email.trim()) {
        errors.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(userInfo.email)) {
        errors.email = 'Email address is invalid.';
    }

    if (!userInfo.password) {
        errors.password = 'Password is required.';
    } else if (userInfo.password.length < 6) {
        errors.password = 'Password must be at least 6 characters.';
    }

    if (!userInfo.password_confirmation) {
        errors.password_confirmation = 'Please confirm your password.';
    } else if (userInfo.password !== userInfo.password_confirmation) {
        errors.password_confirmation = 'Passwords do not match.';
    }

    if (!['client', 'trainer'].includes(userInfo.role)) {
        errors.role = 'Please select a valid role.';
    }

    return errors;
};

export const validateField = (field, value, userInfo) => {
    switch (field) {
        case 'name':
            if (!value.trim()) return 'Name is required.';
            break;
        case 'email':
            if (!value.trim()) return 'Email is required.';
            if (!/\S+@\S+\.\S+/.test(value)) return 'Email address is invalid.';
            break;
        case 'password':
            if (!value) return 'Password is required.';
            if (value.length < 6) return 'Password must be at least 6 characters.';
            break;
        case 'password_confirmation':
            if (!value) return 'Please confirm your password.';
            if (value !== userInfo.password) return 'Passwords do not match.';
            break;
        case 'role':
            if (!['client', 'trainer'].includes(value)) return 'Please select a valid role.';
            break;
        default:
            return null;
    }
    return null;
};

export const validateLoginForm = (userInfo) => {
    const errors = {};

    if (!userInfo.email.trim()) {
        errors.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(userInfo.email)) {
        errors.email = 'Email address is invalid.';
    }

    if (!userInfo.password) {
        errors.password = 'Password is required.';
    }

    return errors;
};

