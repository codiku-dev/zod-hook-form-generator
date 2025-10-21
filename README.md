# Zod hook form generator + intl support

A React Native form components library with Zod validation and multilingual support.
<img width="483" height="1051" alt="image" src="https://github.com/user-attachments/assets/288d1d51-e81c-42a5-897e-8fd868fdec72" />

## Features

- ✅ Automatic validation with Zod
- ✅ Multilingual support (EN/FR)
- ✅ Reusable form components
- ✅ Translated error messages
- ✅ Real-time language switching
- ✅ Conditional fields
- ✅ Complete TypeScript types

## Installation

```bash
bun install
```

## Usage

### Basic Form

```tsx
import React from 'react';
import { ZodForm } from './components/forms';
import { z } from 'zod';
import { IntlProvider, useIntl } from './components/IntlProvider';

// Create Zod schema with translated messages
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

// Wrapper with IntlProvider
export default function App() {
  return (
    <IntlProvider defaultLocale="en">
      <MyForm />
    </IntlProvider>
  );
}
```

### Conditional Fields

```tsx
const schema = z.object({
  hasAddress: z.boolean(),
  address: z.string().meta({
    showConditions: [{ field: 'hasAddress', operator: 'true' }]
  }).optional(),
});
```

### Custom Validation

```tsx
const schema = z.object({
  password: z.string().min(6, t({ id: 'error.password.min' })),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: t({ id: 'error.password.match' }),
  path: ["confirmPassword"],
});
```

## Available Components

### TextInput
Text input field with validation.

```tsx
<TextInput
  control={control}
  name="email"
  label="Email"
  placeholder="Enter your email"
  secureTextEntry={false}
  showError={true}
/>
```

### Select
Dropdown menu for option selection.

```tsx
<Select
  control={control}
  name="country"
  label="Country"
  placeholder="Select a country"
  options={[
    { label: 'France', value: 'fr' },
    { label: 'United States', value: 'us' },
  ]}
  showError={true}
/>
```

### Radio
Radio buttons for single selection.

```tsx
<Radio
  control={control}
  name="gender"
  label="Gender"
  options={[
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
  ]}
  direction="column"
  showError={true}
/>
```

### Switch
Toggle switch for boolean values.

```tsx
<Switch
  control={control}
  name="notifications"
  label="Notifications"
  description="Receive email notifications"
  showError={true}
/>
```

## Adding a New Component

### 1. Create the Component

Create a new file in `components/forms/` :

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
            {/* Your custom component here */}
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
  // Styles for your component
});
```

### 2. Export the Component

Add the export in `components/forms/index.ts` :

```tsx
export { MyComponent } from './MyComponent';
```

### 3. Add Support in ZodForm

Modify `components/forms/ZodForm.tsx` to support your new type :

```tsx
// In FieldConfig interface
type: 'string' | 'number' | 'boolean' | 'enum' | 'myCustomType';

// In renderField function
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

### 4. Add Translations

Add translation keys in `i18n/en.ts` and `i18n/fr.ts` :

```tsx
// i18n/en.ts
export const en = {
  // ... other translations
  'field.myCustomField': 'My Custom Field',
  'form.myCustomField.placeholder': 'Enter custom value',
  'error.myCustomField.required': 'This field is required',
};

// i18n/fr.ts
export const fr = {
  // ... other translations
  'field.myCustomField': 'Mon champ personnalisé',
  'form.myCustomField.placeholder': 'Entrez une valeur personnalisée',
  'error.myCustomField.required': 'Ce champ est requis',
};
```

## File Structure

```
components/
├── forms/
│   ├── index.ts          # Component exports
│   ├── ZodForm.tsx       # Main component
│   ├── TextInput.tsx     # Text input field
│   ├── Select.tsx        # Dropdown menu
│   ├── Radio.tsx         # Radio buttons
│   ├── Switch.tsx        # Toggle switch
│   └── validators.ts     # Custom validators
├── IntlProvider.tsx      # Multilingual provider
i18n/
├── en.ts                 # English translations
└── fr.ts                 # French translations
```

## API Reference

### ZodForm Props

| Prop | Type | Description |
|------|------|-------------|
| `schema` | `ZodSchema` | Zod schema for validation |
| `onSubmit` | `(data) => void` | Callback called on submission |
| `formOptions` | `UseFormProps` | React Hook Form options |
| `showSubmitButton` | `boolean` | Show submit button |
| `submitButtonText` | `string` | Submit button text |
| `showFieldErrors` | `boolean` | Show field errors |
| `onForm` | `(form) => void` | Callback with form instance |

### Conditional Fields

Use `meta({ showConditions: [...] })` to make fields conditional :

```tsx
z.string().meta({
  showConditions: [
    { field: 'country', operator: 'equals', value: 'us' },
    { field: 'age', operator: '>=', value: 18 }
  ]
})
```

**Available operators:**
- `equals` : strict equality
- `notEquals` : difference
- `contains` : contains (for strings)
- `notContains` : does not contain
- `true` : true value
- `false` : false value

## Development

```bash
# Install dependencies
bun install

# Start development server
bun start
```

## License

MIT
