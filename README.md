# React Native Form Components

Une bibliothèque de composants de formulaire React Native avec validation Zod et support multilingue.

<img width="456" height="977" alt="image" src="https://github.com/user-attachments/assets/ce2de871-279d-42e2-aa7b-d62c47ce7b04" />


## Fonctionnalités

- ✅ Validation automatique avec Zod
- ✅ Support multilingue (EN/FR)
- ✅ Composants de formulaire réutilisables
- ✅ Messages d'erreur traduits
- ✅ Changement de langue en temps réel
- ✅ Champs conditionnels
- ✅ Types TypeScript complets

## Installation

```bash
bun install
```

## Utilisation

### Formulaire de base

```tsx
import React from 'react';
import { ZodForm } from './components/forms';
import { z } from 'zod';
import { IntlProvider, useIntl } from './components/IntlProvider';

// Créer un schéma Zod avec messages traduits
const createFormSchema = (t: (descriptor: { id: string; defaultMessage?: string }) => string) => 
  z.object({
    name: z.string().min(2, t({ id: 'error.name.min' })),
    email: z.string().email(t({ id: 'error.email.invalid' })),
    age: z.number().min(18, t({ id: 'error.age.min' })),
  });

function MyForm() {
  const t = useIntl().formatMessage;
  const formSchema = React.useMemo(() => createFormSchema(t), [t]);

  return (
    <ZodForm
      schema={formSchema}
      onSubmit={(data) => console.log(data)}
      formOptions={{
        defaultValues: {
          name: '',
          email: '',
          age: 18,
        },
        mode: 'onChange',
      }}
      submitButtonText={t({ id: 'form.submit' })}
    />
  );
}

// Wrapper avec IntlProvider
export default function App() {
  return (
    <IntlProvider defaultLocale="en">
      <MyForm />
    </IntlProvider>
  );
}
```

### Champs conditionnels

```tsx
const schema = z.object({
  hasAddress: z.boolean(),
  address: z.string().meta({
    showConditions: [{ field: 'hasAddress', operator: 'true' }]
  }).optional(),
});
```

### Validation personnalisée

```tsx
const schema = z.object({
  password: z.string().min(6, t({ id: 'error.password.min' })),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: t({ id: 'error.password.match' }),
  path: ["confirmPassword"],
});
```

## Composants disponibles

### TextInput
Champ de saisie de texte avec validation.

```tsx
<TextInput
  control={control}
  name="email"
  label="Email"
  placeholder="Entrez votre email"
  secureTextEntry={false}
  showError={true}
/>
```

### Select
Menu déroulant pour sélectionner une option.

```tsx
<Select
  control={control}
  name="country"
  label="Pays"
  placeholder="Sélectionnez un pays"
  options={[
    { label: 'France', value: 'fr' },
    { label: 'États-Unis', value: 'us' },
  ]}
  showError={true}
/>
```

### Radio
Boutons radio pour sélection unique.

```tsx
<Radio
  control={control}
  name="gender"
  label="Genre"
  options={[
    { label: 'Homme', value: 'male' },
    { label: 'Femme', value: 'female' },
  ]}
  direction="column"
  showError={true}
/>
```

### Switch
Interrupteur pour valeurs booléennes.

```tsx
<Switch
  control={control}
  name="notifications"
  label="Notifications"
  description="Recevoir les notifications par email"
  showError={true}
/>
```

## Ajouter un nouveau composant

### 1. Créer le composant

Créez un nouveau fichier dans `components/forms/` :

```tsx
// components/forms/MyComponent.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';

interface MyComponentProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  placeholder?: string;
  showError?: boolean;
}

export function MyComponent<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  showError = true,
}: MyComponentProps<T>) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <Controller
        control={control}
        name={name}
        render={({ field, fieldState }) => (
          <View>
            {/* Votre composant personnalisé ici */}
            <TextInput
              value={field.value}
              onChangeText={field.onChange}
              placeholder={placeholder}
              style={styles.input}
            />
            
            {showError && fieldState.error && (
              <Text style={styles.errorText}>
                {fieldState.error.message}
              </Text>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Styles pour votre composant
});
```

### 2. Exporter le composant

Ajoutez l'export dans `components/forms/index.ts` :

```tsx
export { MyComponent } from './MyComponent';
```

### 3. Ajouter le support dans ZodForm

Modifiez `components/forms/ZodForm.tsx` pour supporter votre nouveau type :

```tsx
// Dans l'interface FieldConfig
type: 'string' | 'number' | 'boolean' | 'enum' | 'myCustomType';

// Dans la fonction renderField
case 'myCustomType':
  return (
    <MyComponent
      control={control}
      name={fieldName}
      label={config.label}
      placeholder={config.placeholder}
      showError={false}
    />
  );
```

### 4. Ajouter les traductions

Ajoutez les clés de traduction dans `i18n/en.ts` et `i18n/fr.ts` :

```tsx
// i18n/en.ts
export const en = {
  // ... autres traductions
  'field.myCustomField': 'My Custom Field',
  'form.myCustomField.placeholder': 'Enter custom value',
  'error.myCustomField.required': 'This field is required',
};

// i18n/fr.ts
export const fr = {
  // ... autres traductions
  'field.myCustomField': 'Mon champ personnalisé',
  'form.myCustomField.placeholder': 'Entrez une valeur personnalisée',
  'error.myCustomField.required': 'Ce champ est requis',
};
```

## Structure des fichiers

```
components/
├── forms/
│   ├── index.ts          # Exports des composants
│   ├── ZodForm.tsx       # Composant principal
│   ├── TextInput.tsx     # Champ de saisie
│   ├── Select.tsx        # Menu déroulant
│   ├── Radio.tsx         # Boutons radio
│   ├── Switch.tsx        # Interrupteur
│   └── validators.ts     # Validateurs personnalisés
├── IntlProvider.tsx      # Provider multilingue
i18n/
├── en.ts                 # Traductions anglaises
└── fr.ts                 # Traductions françaises
```

## API Reference

### ZodForm Props

| Prop | Type | Description |
|------|------|-------------|
| `schema` | `ZodSchema` | Schéma Zod pour la validation |
| `onSubmit` | `(data) => void` | Callback appelé à la soumission |
| `formOptions` | `UseFormProps` | Options du formulaire React Hook Form |
| `showSubmitButton` | `boolean` | Afficher le bouton de soumission |
| `submitButtonText` | `string` | Texte du bouton de soumission |
| `showFieldErrors` | `boolean` | Afficher les erreurs des champs |
| `onForm` | `(form) => void` | Callback avec l'instance du formulaire |

### Champs conditionnels

Utilisez `meta({ showConditions: [...] })` pour rendre des champs conditionnels :

```tsx
z.string().meta({
  showConditions: [
    { field: 'country', operator: 'equals', value: 'us' },
    { field: 'age', operator: '>=', value: 18 }
  ]
})
```

**Opérateurs disponibles :**
- `equals` : égalité stricte
- `notEquals` : différence
- `contains` : contient (pour les strings)
- `notContains` : ne contient pas
- `true` : valeur vraie
- `false` : valeur fausse

## Développement

```bash
# Installer les dépendances
bun install

# Démarrer le serveur de développement
bun start
```

## Licence

MIT
