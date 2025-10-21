import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useForm, Control, FieldValues, Path, UseFormProps, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TextInput } from './TextInput';
import { Select } from './Select';
import { Radio } from './Radio';
import { Switch } from './Switch';
import { useIntl } from '../IntlProvider';

interface ZodFormProps<T extends z.ZodType<any, any, any> = z.ZodType<any, any, any>> {
    schema: T;
    onSubmit: (data: z.infer<T>) => void;
    formOptions?: Omit<UseFormProps<z.infer<T>>, 'resolver'>;
    className?: string;
    showSubmitButton?: boolean;
    submitButtonText?: string;
    showFieldErrors?: boolean;
    onForm?: (form: UseFormReturn<z.core.output<T>, any, z.core.output<T>>) => void;
}

interface FieldConfig {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'enum';
    label?: string;
    placeholder?: string;
    description?: string;
    options?: Array<{ label: string; value: string | number }>;
    isRequired: boolean;
    isVisible: boolean;
    isPassword?: boolean;
    showConditions?: Array<{
        field: string;
        operator: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'true' | 'false';
        value?: any;
    }>;
    dependsOn?: string[]; // Champs dont dépend la visibilité
}

export function ZodForm<T extends z.ZodType<any, any, any> = z.ZodType<any, any, any>>({
    schema,
    onSubmit,
    formOptions = {},
    showSubmitButton = true,
    submitButtonText = 'Submit',
    showFieldErrors = true,
    onForm,
}: ZodFormProps<T>) {
    const { formatMessage, locale } = useIntl();
    const t = formatMessage;
    const form = useForm<z.infer<T>>({
        resolver: zodResolver(schema) as any,
        ...formOptions,
    });

    // Exposer le form via le callback
    React.useEffect(() => {
        onForm?.(form);
    }, [form, onForm]);

    // Forcer la revalidation du formulaire quand la langue change
    React.useEffect(() => {
        // Revalider tous les champs pour mettre à jour les messages d'erreur
        form.trigger();
    }, [locale, form]);

    const watchedValues = form.watch();


    const fieldConfigs = useMemo(() => {
        const configs: FieldConfig[] = [];

        if (schema instanceof z.ZodObject) {
            const shape = schema.shape;

            Object.entries(shape).forEach(([fieldName, fieldSchema]) => {
                const config: FieldConfig = {
                    name: fieldName,
                    type: 'string',
                    isRequired: false,
                    isVisible: true,
                };

                // Déterminer le type et les propriétés du champ
                if (fieldSchema instanceof z.ZodString) {
                    config.type = 'string';
                    config.isRequired = !fieldSchema.isOptional();

                    // Vérifier si c'est un email
                    if (fieldSchema._def.checks?.some((check: any) => check.kind === 'email')) {
                        config.placeholder = t({ id: 'form.email.placeholder' });
                    } else if (fieldName.toLowerCase().includes('password')) {
                        config.placeholder = t({ id: 'form.password.placeholder' });
                        config.isPassword = true;
                    } else {
                        config.placeholder = t({ id: 'form.field.placeholder' }, { fieldName });
                    }
                } else if (fieldSchema instanceof z.ZodNumber) {
                    config.type = 'number';
                    config.isRequired = !fieldSchema.isOptional();
                    config.placeholder = t({ id: 'form.field.placeholder' }, { fieldName });
                } else if (fieldSchema instanceof z.ZodBoolean) {
                    config.type = 'boolean';
                    config.isRequired = false;
                } else if (fieldSchema instanceof z.ZodEnum) {
                    config.type = 'enum';
                    config.isRequired = !fieldSchema.isOptional();
                    config.options = fieldSchema.options.map((option: string | number) => {
                        const optionKey = `${fieldName}.${option}`;
                        const translatedLabel = t({ id: optionKey, defaultMessage: String(option).charAt(0).toUpperCase() + String(option).slice(1) });
                        return {
                            label: translatedLabel,
                            value: option,
                        };
                    });
                } else if (fieldSchema instanceof z.ZodOptional) {
                    const innerSchema = fieldSchema._def.innerType;
                    if (innerSchema instanceof z.ZodString) {
                        config.type = 'string';
                        config.isRequired = false;
                        if (fieldName.toLowerCase().includes('password')) {
                            config.placeholder = t({ id: 'form.password.placeholder' });
                            config.isPassword = true;
                        } else {
                            config.placeholder = t({ id: 'form.field.placeholder' }, { fieldName });
                        }
                    } else if (innerSchema instanceof z.ZodNumber) {
                        config.type = 'number';
                        config.isRequired = false;
                        config.placeholder = t({ id: 'form.field.placeholder' }, { fieldName });
                    } else if (innerSchema instanceof z.ZodBoolean) {
                        config.type = 'boolean';
                        config.isRequired = false;
                    } else if (innerSchema instanceof z.ZodEnum) {
                        config.type = 'enum';
                        config.isRequired = false;
                        config.options = innerSchema.options.map((option: string | number) => {
                            const optionKey = `${fieldName}.${option}`;
                            const translatedLabel = t({ id: optionKey, defaultMessage: String(option).charAt(0).toUpperCase() + String(option).slice(1) });
                            return {
                                label: translatedLabel,
                                value: option,
                            };
                        });
                    }
                }

                // Extraire les showConditions de visibilité depuis meta
                let meta = null;

                // Le meta est une fonction, pas une propriété directe
                try {
                    meta = (fieldSchema as any).meta();
                } catch (e) {
                    // Si ça ne marche pas, essayer d'autres méthodes
                }

                // Si c'est un champ optionnel et qu'on n'a pas trouvé de meta, vérifier le schéma interne
                if (fieldSchema instanceof z.ZodOptional && !meta) {
                    const innerSchema = fieldSchema._def.innerType;
                    try {
                        meta = (innerSchema as any).meta();
                    } catch (e) {
                        // Ignorer l'erreur
                    }
                }


                // Vérifier si on a des showConditions directement dans le meta
                if (meta && Array.isArray(meta.showConditions)) {
                    config.showConditions = meta.showConditions;
                }

                // Générer le label à partir du nom du champ
                const fieldKey = `field.${fieldName}`;
                config.label = t({
                    id: fieldKey, defaultMessage: fieldName
                        .split(/(?=[A-Z])/)
                        .join(' ')
                        .toLowerCase()
                        .replace(/^\w/, c => c.toUpperCase())
                });

                configs.push(config);
            });
        }

        return configs;
    }, [schema, t, locale]);

    const isFieldVisible = React.useCallback((config: FieldConfig): boolean => {
        if (!config.showConditions || config.showConditions.length === 0) {
            return true;
        }

        const result = config.showConditions.every(condition => {
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

        return result;
    }, [watchedValues]);

    const renderField = (config: FieldConfig) => {
        if (!isFieldVisible(config)) {
            return null;
        }

        const control = form.control as any;
        const fieldName = config.name as Path<z.infer<T>>;
        const error = form.formState.errors[config.name];

        return (
            <View key={config.name} style={styles.fieldContainer}>
                {(() => {
                    switch (config.type) {
                        case 'string':
                            return (
                                <TextInput
                                    control={control}
                                    name={fieldName}
                                    label={config.label}
                                    placeholder={config.placeholder}
                                    secureTextEntry={config.isPassword}
                                    showError={false}
                                />
                            );

                        case 'number':
                            return (
                                <TextInput
                                    control={control}
                                    name={fieldName}
                                    label={config.label}
                                    placeholder={config.placeholder}
                                    showError={false}
                                />
                            );

                        case 'boolean':
                            return (
                                <Switch
                                    control={control}
                                    name={fieldName}
                                    label={config.label}
                                    description={config.description}
                                    showError={false}
                                />
                            );

                        case 'enum':
                            if (!config.options) return null;

                            // Utiliser Radio si moins de 4 options, sinon Select
                            if (config.options.length <= 3) {
                                return (
                                    <Radio
                                        control={control}
                                        name={fieldName}
                                        label={config.label}
                                        options={config.options}
                                        direction="column"
                                        showError={false}
                                    />
                                );
                            } else {
                                return (
                                    <Select
                                        control={control}
                                        name={fieldName}
                                        label={config.label}
                                        placeholder={t({ id: 'form.select.placeholder' }, { fieldName: config.label?.toLowerCase() })}
                                        options={config.options}
                                        showError={false}
                                    />
                                );
                            }

                        default:
                            return null;
                    }
                })()}

                {/* Réservation d'espace pour les erreurs */}
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

    return (
        <View style={styles.container}>
            {fieldConfigs.map(renderField)}

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

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    fieldContainer: {
        marginBottom: 16,
    },
    errorContainer: {
        minHeight: 20, // Réserve de l'espace pour les erreurs
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
