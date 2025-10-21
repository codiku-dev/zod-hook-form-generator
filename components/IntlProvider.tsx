import React, { createContext, useContext, useState, useEffect } from 'react';
import { IntlProvider as ReactIntlProvider } from 'react-intl';
import { View, Text, StyleSheet } from 'react-native';
import { fr } from '../i18n/fr';
import { en } from '../i18n/en';
// Messages pour les différentes langues
const messages = {
    en,
    fr
};

type Locale = 'en' | 'fr';

interface IntlContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    formatMessage: (descriptor: { id: string; defaultMessage?: string }, values?: Record<string, any>) => string;
}

const IntlContext = createContext<IntlContextType | undefined>(undefined);

export const useIntl = () => {
    const context = useContext(IntlContext);
    if (!context) {
        throw new Error('useIntl must be used within an IntlProvider');
    }
    return context;
};

interface IntlProviderProps {
    children: React.ReactNode;
    defaultLocale?: Locale;
}

export const IntlProvider: React.FC<IntlProviderProps> = ({
    children,
    defaultLocale = 'en'
}) => {
    const [locale, setLocale] = useState<Locale>(defaultLocale);

    const formatMessage = (descriptor: { id: string; defaultMessage?: string }, values?: Record<string, any>) => {
        const message = messages[locale][descriptor.id as keyof typeof messages[typeof locale]];
        if (!message) {
            console.warn(`Message not found for key: ${descriptor.id}`);
            return descriptor.defaultMessage || descriptor.id;
        }

        if (values) {
            return message.replace(/\{(\w+)\}/g, (match, key) => {
                return values[key] || match;
            });
        }

        return message;
    };

    const contextValue: IntlContextType = {
        locale,
        setLocale,
        formatMessage,
    };

    return (
        <IntlContext.Provider value={contextValue}>
            <ReactIntlProvider locale={locale} messages={messages[locale]}>
                {children}
            </ReactIntlProvider>
        </IntlContext.Provider>
    );
};

// Composant pour changer de langue (optionnel)
export const LocaleSwitcher: React.FC = () => {
    const { locale, setLocale } = useIntl();

    return (
        <View style={styles.localeSwitcher}>
            <Text style={styles.localeText}>Language:</Text>
            <View style={styles.localeButtons}>
                <Text
                    style={[styles.localeButton, locale === 'en' && styles.activeLocale]}
                    onPress={() => setLocale('en')}
                >
                    EN
                </Text>
                <Text
                    style={[styles.localeButton, locale === 'fr' && styles.activeLocale]}
                    onPress={() => setLocale('fr')}
                >
                    FR
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    localeSwitcher: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#f5f5f5',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    localeText: {
        fontSize: 16,
        fontWeight: '500',
        marginRight: 12,
    },
    localeButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    localeButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#e0e0e0',
        borderRadius: 4,
        fontSize: 14,
        fontWeight: '500',
    },
    activeLocale: {
        backgroundColor: '#1976d2',
        color: '#fff',
    },
});
