import React, { useCallback, useEffect, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useForm, Control, FieldValues, Path, UseFormProps, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TextInput } from './TextInput';
import { Select } from './Select';
import { Radio } from './Radio';
import { Switch } from './Switch';
import { useIntl } from '../IntlProvider';

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

/**
 * Props for the ZodForm component
 * Generic type T extends ZodType to ensure type safety with Zod schemas
 */
interface ZodFormProps<T extends z.ZodType<any, any, any> = z.ZodType<any, any, any>> {
    schema: T; // Zod schema for validation
    onSubmit: (data: z.infer<T>) => void; // Callback when form is submitted
    formOptions?: Omit<UseFormProps<z.infer<T>>, 'resolver'>; // React Hook Form options
    className?: string; // CSS class name (not used in React Native)
    showSubmitButton?: boolean; // Whether to show submit button
    submitButtonText?: string; // Text for submit button
    showFieldErrors?: boolean; // Whether to show field errors
    onForm?: (form: UseFormReturn<z.core.output<T>, any, z.core.output<T>>) => void; // Form instance callback
}


// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * ZodForm - Main form component that automatically generates form fields from Zod schema
 * Features:
 * - Automatic field generation based on Zod schema
 * - Multilingual support with real-time language switching
 * - Conditional field visibility
 * - Type-safe form handling
 */
export function ZodForm<T extends z.ZodType<any, any, any> = z.ZodType<any, any, any>>({
    schema,
    onSubmit,
    formOptions = {},
    showSubmitButton = true,
    submitButtonText = 'Submit',
    showFieldErrors = true,
    onForm,
}: ZodFormProps<T>) {
    // ============================================================================
    // HOOKS & STATE
    // ============================================================================

    const { formatMessage, locale } = useIntl();
    const t = formatMessage;

    // Initialize React Hook Form with Zod resolver
    const form = useForm<z.infer<T>>({
        resolver: zodResolver(schema) as any,
        ...formOptions,
    });

    // Expose form instance to parent component via callback
    useEffect(() => {
        onForm?.(form);
    }, [form, onForm]);

    // Force form revalidation when language changes to update error messages
    useEffect(() => {
        form.trigger(); // Revalidate all fields to update error messages
    }, [locale, form]);

    // Watch all form values for conditional field logic
    const watchedValues = form.watch();


    // ============================================================================
    // FIELD SCHEMA PROCESSING
    // ============================================================================

    /**
     * Get field schemas from Zod schema
     * Simple extraction without complex configuration objects
     */
    const fieldSchemas = useMemo(() => {
        if (!(schema instanceof z.ZodObject)) return [];

        return Object.entries(schema.shape).map(([fieldName, fieldSchema]) => ({
            name: fieldName,
            schema: fieldSchema,
        }));
    }, [schema]);

    // ============================================================================
    // CONDITIONAL FIELD VISIBILITY LOGIC
    // ============================================================================

    /**
     * Extract showConditions from field schema meta data
     */
    const getShowConditions = React.useCallback((fieldSchema: z.ZodTypeAny) => {
        let meta = null;

        try {
            meta = (fieldSchema as any).meta();
        } catch (e) {
            // Meta might not be available
        }

        // For optional fields, try to get meta from inner schema
        if (fieldSchema instanceof z.ZodOptional && !meta) {
            const innerSchema = fieldSchema._def.innerType;
            try {
                meta = (innerSchema as any).meta();
            } catch (e) {
                // Ignore errors when accessing meta
            }
        }

        return meta?.showConditions || [];
    }, []);

    /**
     * Determine if a field should be visible based on its showConditions
     */
    const isFieldVisible = React.useCallback((showConditions: any[]): boolean => {
        if (!showConditions || showConditions.length === 0) {
            return true;
        }

        return showConditions.every(condition => {
            const fieldValue = watchedValues[condition.field as keyof typeof watchedValues];

            switch (condition.operator) {
                case 'equals':
                    return fieldValue === condition.value;
                case 'notEquals':
                    return fieldValue !== condition.value;
                case 'contains':
                    return typeof fieldValue === 'string' && fieldValue.includes(condition.value);
                case 'notContains':
                    return typeof fieldValue === 'string' && !fieldValue.includes(condition.value);
                case 'true':
                    return fieldValue === true;
                case 'false':
                    return fieldValue === false;
                default:
                    return true;
            }
        });
    }, [watchedValues]);

    // ============================================================================
    // FIELD RENDERING LOGIC
    // ============================================================================

    /**
     * Render a single form field based on its schema
     * Pass props directly to components instead of complex configuration
     */
    const renderField = ({ name, schema }: { name: string; schema: z.ZodTypeAny }) => {
        const control = form.control as any;
        const fieldName = name as Path<z.infer<T>>;
        const error = form.formState.errors[name];

        // Get show conditions and check visibility
        const showConditions = getShowConditions(schema);
        if (!isFieldVisible(showConditions)) {
            return null;
        }

        // Generate label and description from i18n
        const label = t({
            id: `field.${name}`,
            defaultMessage: name
                .split(/(?=[A-Z])/)
                .join(' ')
                .toLowerCase()
                .replace(/^\w/, c => c.toUpperCase())
        });

        const description = t({
            id: `field.${name}.description`,
            defaultMessage: undefined // Only use if translation exists
        });

        const placeholder = t({
            id: `field.${name}.placeholder`,
            defaultMessage: undefined // Only use if translation exists
        });

        return (
            <View key={name} style={styles.fieldContainer}>
                {/* Render appropriate component based on schema type */}
                {(() => {
                    // Handle ZodString fields
                    if (schema instanceof z.ZodString) {
                        const isPassword = name.toLowerCase().includes('password');

                        return (
                            <TextInput
                                control={control}
                                name={fieldName}
                                label={label}
                                placeholder={placeholder}
                                secureTextEntry={isPassword}
                                showError={false}
                            />
                        );
                    }

                    // Handle ZodNumber fields
                    else if (schema instanceof z.ZodNumber) {
                        return (
                            <TextInput
                                control={control}
                                name={fieldName}
                                label={label}
                                placeholder={placeholder}
                                showError={false}
                            />
                        );
                    }

                    // Handle ZodBoolean fields
                    else if (schema instanceof z.ZodBoolean) {
                        return (
                            <Switch
                                control={control}
                                name={fieldName}
                                label={label}
                                description={description}
                                showError={false}
                            />
                        );
                    }

                    // Handle ZodEnum fields
                    else if (schema instanceof z.ZodEnum) {
                        const options = schema.options.map((option: string | number) => {
                            const optionKey = `${name}.${option}`;
                            const translatedLabel = t({
                                id: optionKey,
                                defaultMessage: String(option).charAt(0).toUpperCase() + String(option).slice(1)
                            });
                            return {
                                label: translatedLabel,
                                value: option,
                            };
                        });

                        // Use Radio for 3 or fewer options, Select for more
                        if (options.length <= 3) {
                            return (
                                <Radio
                                    control={control}
                                    name={fieldName}
                                    label={label}
                                    options={options}
                                    direction="column"
                                    showError={false}
                                />
                            );
                        } else {
                            return (
                                <Select
                                    control={control}
                                    name={fieldName}
                                    label={label}
                                    options={options}
                                    showError={false}
                                />
                            );
                        }
                    }

                    // Handle ZodOptional fields (wrapped types)
                    else if (schema instanceof z.ZodOptional) {
                        const innerSchema = schema._def.innerType;

                        if (innerSchema instanceof z.ZodString) {
                            const isPassword = name.toLowerCase().includes('password');

                            return (
                                <TextInput
                                    control={control}
                                    name={fieldName}
                                    label={label}
                                    placeholder={placeholder}
                                    secureTextEntry={isPassword}
                                    showError={false}
                                />
                            );
                        } else if (innerSchema instanceof z.ZodNumber) {
                            return (
                                <TextInput
                                    control={control}
                                    name={fieldName}
                                    label={label}
                                    placeholder={placeholder}
                                    showError={false}
                                />
                            );
                        } else if (innerSchema instanceof z.ZodBoolean) {
                            return (
                                <Switch
                                    control={control}
                                    name={fieldName}
                                    label={label}
                                    description={description}
                                    showError={false}
                                />
                            );
                        } else if (innerSchema instanceof z.ZodEnum) {
                            const options = innerSchema.options.map((option: string | number) => {
                                const optionKey = `${name}.${option}`;
                                const translatedLabel = t({
                                    id: optionKey,
                                    defaultMessage: String(option).charAt(0).toUpperCase() + String(option).slice(1)
                                });
                                return {
                                    label: translatedLabel,
                                    value: option,
                                };
                            });

                            if (options.length <= 3) {
                                return (
                                    <Radio
                                        control={control}
                                        name={fieldName}
                                        label={label}
                                        options={options}
                                        direction="column"
                                        showError={false}
                                    />
                                );
                            } else {
                                return (
                                    <Select
                                        control={control}
                                        name={fieldName}
                                        label={label}
                                        options={options}
                                        showError={false}
                                    />
                                );
                            }
                        }
                    }

                    return null; // Unknown field type
                })()}

                {/* Error message display */}
                <View style={styles.errorContainer}>
                    {showFieldErrors && error && (
                        <Text style={styles.errorText}>
                            {(error as any)?.message || t({ id: 'error.required' })}
                        </Text>
                    )}
                </View>
            </View>
        );
    };

    // ============================================================================
    // COMPONENT RENDER
    // ============================================================================

    return (
        <View style={styles.container}>
            {/* Render all form fields */}
            {fieldSchemas.map(renderField)}

            {/* Submit button with validation state */}
            {showSubmitButton && (
                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        form.formState.isValid ? { opacity: 1 } : { opacity: 0.5 }
                    ]}
                    onPress={form.handleSubmit(onSubmit as any)}
                    disabled={!form.formState.isValid}
                >
                    <Text style={styles.submitButtonText}>{submitButtonText}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    fieldContainer: {
        marginBottom: 16, // Space between fields
    },
    errorContainer: {
        minHeight: 20, // Reserve space for error messages to prevent layout shift
        justifyContent: 'flex-start',
    },
    submitButton: {
        backgroundColor: '#1976d2',
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 24,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    errorText: {
        color: '#ff4444',
        fontSize: 14,
        marginTop: 4,
        marginLeft: 4,
    },
});
