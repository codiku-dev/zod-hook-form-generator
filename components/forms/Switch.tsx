import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form';

interface SwitchProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label?: string;
  description?: string;
  showError?: boolean;
}

export function Switch<T extends FieldValues>({
  control,
  name,
  label,
  description,
  showError = true,
}: SwitchProps<T>) {
  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <View>
            <TouchableOpacity
              style={styles.switchContainer}
              onPress={() => onChange(!value)}
              activeOpacity={0.7}
            >
              <View style={styles.labelContainer}>
                {label && <Text style={styles.label}>{label}</Text>}
                {description && <Text style={styles.description}>{description}</Text>}
              </View>
              
              <View style={[
                styles.switchTrack,
                value && styles.switchTrackActive,
              ]}>
                <View style={[
                  styles.switchThumb,
                  value && styles.switchThumbActive,
                ]} />
              </View>
            </TouchableOpacity>
            
            {showError && error && <Text style={styles.errorText}>{error.message}</Text>}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  labelContainer: {
    flex: 1,
    marginRight: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  switchTrack: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  switchTrackActive: {
    backgroundColor: '#1976d2',
  },
  switchThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  switchThumbActive: {
    transform: [{ translateX: 20 }],
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginTop: 4,
  },
});
