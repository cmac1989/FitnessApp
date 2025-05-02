import { useState } from 'react';

const useForm = (initialValues, validateForm, validateField) => {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});

    const handleChange = (field, value) => {
        setValues(prev => ({ ...prev, [field]: value }));

        if (validateField) {
            const error = validateField(field, value, { ...values, [field]: value });
            setErrors(prev => ({ ...prev, [field]: error }));
        }
    };

    const handleSubmit = async (onSubmit) => {
        const validationErrors = validateForm(values);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return false;
        }
        await onSubmit(values);
        return true;
    };

    const resetForm = () => {
        setValues(initialValues);
        setErrors({});
    };

    return {
        values,
        errors,
        handleChange,
        handleSubmit,
        resetForm,
        setValues,
        setErrors,
    };
};

export default useForm;
