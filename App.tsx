import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, } from 'react-native';
import { z } from 'zod';
import { ZodForm } from './components/forms';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IntlProvider, LocaleSwitcher, useIntl } from './components/IntlProvider';
import { PasswordValidator, PhoneValidator } from './components/forms/validators';
import { UseFormReturn } from 'react-hook-form';



// Fonction pour créer le schéma avec les messages traduits
const createFormSchema = (t: (descriptor: { id: string; defaultMessage?: string }) => string, form: UseFormReturn<any, any, any> | null) => z.object({
  name: z.string().min(2, t({ id: 'error.name.min' })),
  email: z.string().email(t({ id: 'error.email.invalid' })),
  country: z.enum(['us', 'ca', 'uk', 'fr', 'de']),
  gender: z.enum(['male', 'female', 'other', 'prefer-not-to-say']),
  notifications: z.boolean(),
  password: z.string().min(6, t({ id: 'error.password.min' })),
  repeatPassword: z.string().min(6, t({ id: 'error.password.min' })),
  newsletter: z.boolean().meta({
    showConditions: [{ field: 'notifications', operator: 'equals', value: true }]
  }).optional(),
  phoneNumber: z.string().meta({
    showConditions: [{ field: 'country', operator: 'equals', value: 'us' }]
  }).optional(),
  address: z.string().meta({
    showConditions: [{ field: 'country', operator: 'notEquals', value: 'us' }]
  }).optional(),
  terms: z.boolean().refine(function checkTermsAccepted(val) {
    return val === true;
  }, {
    message: t({ id: 'error.terms.required' }),
  }),
}).refine(function checkPasswordMatch(data) {
  return PasswordValidator.checkPassword.validation(data.password);
}, {
  message: PasswordValidator.checkPassword.errMessage(t),
  path: ["repeatPassword"],
}).refine(function checkPhoneNumberLength(data) {
  if (data.country !== 'us') return true;
  form?.trigger('phoneNumber');
  return PhoneValidator.checkPhoneNumber.validation(data.phoneNumber);
}, {
  message: PhoneValidator.checkPhoneNumber.errMessage(t),
  path: ["phoneNumber"],
});

function AppContent() {
  const t = useIntl().formatMessage
  const [form, setForm] = React.useState<UseFormReturn<any, any, any> | null>(null);
  // Recréer le schéma quand formRef change
  const formSchema = React.useMemo(() => {
    return createFormSchema(t, form);
  }, [t, form]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <LocaleSwitcher />
          <Text style={styles.title}>{t({ id: 'app.title' })}</Text>
          <View style={styles.form}>
            <ZodForm
              schema={formSchema}
              formOptions={{
                defaultValues: {
                  name: 'Robin Lebhar',
                  email: 'robin@lebhar.com',
                  country: 'fr',
                  gender: 'male',
                  notifications: false,
                  password: '123456',
                  repeatPassword: '123456',
                  address: '123 Main St, Anytown, USA',
                  terms: false,
                  phoneNumber: '',
                },
                mode: 'onChange',
                reValidateMode: 'onChange',
              }}
              onSubmit={(data) => {
                Alert.alert('Form Submitted', JSON.stringify(data, null, 2));
              }}
              showFieldErrors={true}
              submitButtonText={t({ id: 'form.submit' })}
              onForm={setForm}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <IntlProvider defaultLocale="en">
      <AppContent />
    </IntlProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    marginTop: 20,
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonContainer: {
    marginTop: 24,
    gap: 12,
  },
  submitButton: {
    backgroundColor: '#1976d2',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resetButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  resetButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});
