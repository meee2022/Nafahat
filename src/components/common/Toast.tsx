/**
 * نظام Toast بسيط للإشعارات المؤقتة (إنجازات، نجاحات، تنبيهات).
 *
 * الاستخدام:
 *   import { useToast } from '@components/common/Toast';
 *   const { show } = useToast();
 *   show({ title: 'تم الحفظ', description: '...', type: 'success' });
 *
 * يجب لفّ التطبيق بـ <ToastProvider /> مرة واحدة في الـ root.
 */
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Animated, Dimensions } from 'react-native';
import { Award, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Text } from '@components/ui';

export type ToastType = 'success' | 'achievement' | 'info' | 'warning' | 'error';

interface ToastInput {
  title: string;
  description?: string;
  type?: ToastType;
  duration?: number; // ms
}

interface ToastItem extends ToastInput {
  id: string;
}

interface ToastContextValue {
  show: (input: ToastInput) => void;
}

const ToastContext = createContext<ToastContextValue>({ show: () => {} });

export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback((input: ToastInput) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const item: ToastItem = { id, ...input };
    setToasts((prev) => [...prev, item]);
    const duration = input.duration ?? 4000;
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <View pointerEvents="box-none" style={styles.container}>
        {toasts.map((t) => (
          <ToastCard key={t.id} item={t} onClose={() => dismiss(t.id)} />
        ))}
      </View>
    </ToastContext.Provider>
  );
};

const TOAST_WIDTH = Math.min(Dimensions.get('window').width - 32, 420);

const ToastCard: React.FC<{ item: ToastItem; onClose: () => void }> = ({ item, onClose }) => {
  const t = useTheme();
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        damping: 14,
        stiffness: 180,
        mass: 0.7,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  }, []);

  const { icon, accent, bg, border } = getToastStyle(t, item.type ?? 'info');

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: bg,
          borderColor: border,
          transform: [{ translateY }],
          opacity,
          shadowColor: accent,
        },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: accent + '22' }]}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text variant="subtitle" style={{ fontWeight: '800', color: accent }}>
          {item.title}
        </Text>
        {item.description ? (
          <Text variant="bodySm" color={t.colors.textSecondary} style={{ marginTop: 2, lineHeight: 18 }}>
            {item.description}
          </Text>
        ) : null}
      </View>
      <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
        <X size={14} color={t.colors.textTertiary} />
      </Pressable>
    </Animated.View>
  );
};

function getToastStyle(t: ReturnType<typeof useTheme>, type: ToastType) {
  switch (type) {
    case 'success':
      return { icon: <CheckCircle2 size={18} color={t.colors.success} />, accent: t.colors.success, bg: t.colors.surface, border: t.colors.success + '40' };
    case 'achievement':
      return { icon: <Award size={18} color={t.colors.accent} />, accent: t.colors.accent, bg: t.colors.surface, border: t.colors.accent + '60' };
    case 'warning':
      return { icon: <AlertTriangle size={18} color={t.colors.warning} />, accent: t.colors.warning, bg: t.colors.surface, border: t.colors.warning + '40' };
    case 'error':
      return { icon: <AlertTriangle size={18} color={t.colors.error} />, accent: t.colors.error, bg: t.colors.surface, border: t.colors.error + '40' };
    default:
      return { icon: <Info size={18} color={t.colors.info} />, accent: t.colors.info, bg: t.colors.surface, border: t.colors.info + '40' };
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    alignItems: 'center',
    gap: 8,
    zIndex: 9999,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    width: TOAST_WIDTH,
    maxWidth: '100%',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
