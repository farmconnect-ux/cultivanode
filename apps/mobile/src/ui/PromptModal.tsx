import { useEffect, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { color as c, radius, space } from '../theme';
import { Button } from './Button';
import { Text } from './Text';
import { TextField } from './TextField';

type Props = {
  visible: boolean;
  title: string;
  description?: string;
  label: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  initialValue?: string;
  maxLength?: number;
  submitting?: boolean;
  validate?: (value: string) => { valid: true; trimmed: string } | { valid: false; error: string };
  onCancel: () => void;
  onConfirm: (value: string) => void | Promise<void>;
};

export function PromptModal({
  visible,
  title,
  description,
  label,
  placeholder,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  initialValue = '',
  maxLength = 300,
  submitting = false,
  validate,
  onCancel,
  onConfirm,
}: Props) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setValue(initialValue);
      setError(null);
    }
  }, [visible, initialValue]);

  function handleClose() {
    if (submitting) return;
    Keyboard.dismiss();
    onCancel();
  }

  function handleSubmit() {
    if (submitting) return;
    const trimmed = value.trim();
    if (validate) {
      const check = validate(value);
      if (!check.valid) {
        setError(check.error);
        return;
      }
      Keyboard.dismiss();
      setError(null);
      onConfirm(check.trimmed);
      return;
    }
    if (!trimmed) {
      setError('This field is required.');
      return;
    }
    Keyboard.dismiss();
    setError(null);
    onConfirm(trimmed);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleClose}
          accessibilityLabel="Close dialog"
          accessibilityRole="button"
        />
        <View style={styles.sheet} accessibilityViewIsModal>
          <Text variant="heading">{title}</Text>
          {description ? <Text variant="body" muted>{description}</Text> : null}
          <TextField
            label={label}
            placeholder={placeholder}
            value={value}
            onChangeText={(next) => {
              setValue(next);
              if (error) setError(null);
            }}
            error={error ?? undefined}
            maxLength={maxLength}
            multiline
            numberOfLines={3}
            editable={!submitting}
            returnKeyType="done"
            blurOnSubmit
            onSubmitEditing={handleSubmit}
          />
          <View style={styles.actions}>
            <View style={styles.actionBtn}>
              <Button
                title={cancelLabel}
                variant="secondary"
                onPress={handleClose}
                disabled={submitting}
              />
            </View>
            <View style={styles.actionBtn}>
              <Button
                title={confirmLabel}
                variant="primary"
                onPress={handleSubmit}
                loading={submitting}
                disabled={submitting}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    padding: space[5],
  },
  sheet: {
    backgroundColor: c.card,
    borderRadius: radius.lg,
    padding: space[5],
    gap: space[4],
    borderWidth: 1,
    borderColor: c.outline,
  },
  actions: {
    flexDirection: 'row',
    gap: space[3],
  },
  actionBtn: {
    flex: 1,
  },
});
