/**
 * 👤 Avatar Picker — اختيار صورة الملف الشخصي.
 *
 * يدعم مسارين:
 *  1. 📸 رفع صورة من المعرض/الكاميرا (يحتاج expo-image-picker - يـ degrade
 *     بأناقة لو الـ package مش متركّب: يخفي الـ option ويبقى الـ presets).
 *  2. 🎨 اختيار "preset" - 6 لوحات لونية بـ initials. مفيدة لـ:
 *     - المستخدمين اللي ما عندهمش صورة
 *     - الـ children mode (avatars رمزية)
 *     - الأجهزة اللي مفيهاش معرض صور
 *
 * Identity: أخضر primary + ذهبي accent + presets بألوان feature متنوّعة.
 */
import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Image, Modal, Alert } from 'react-native';
import { Camera, ImageIcon, Trash2, X, Check } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Text } from '@components/ui';
import { useUserStore } from '@store/index';
import { log } from '@utils/logger';

interface Preset {
  id: string;
  color: string;
  textColor: string;
  label: string;
}

const PRESETS: Preset[] = [
  { id: 'emerald',   color: '#0A3D38', textColor: '#FFF', label: 'زمرد' },
  { id: 'gold',      color: '#B8923B', textColor: '#0A1815', label: 'ذهب' },
  { id: 'sepia',     color: '#9C7A2D', textColor: '#FFF', label: 'سبتيا' },
  { id: 'teal',      color: '#3F8B8B', textColor: '#FFF', label: 'فيروز' },
  { id: 'carmine',   color: '#0F4A41', textColor: '#FFF', label: 'زمرد عميق' },
  { id: 'saffron',   color: '#C77B2F', textColor: '#FFF', label: 'زعفران' },
];

/**
 * يكتشف وجود expo-image-picker و requires بأمان.
 * يرجع null لو الـ package مش متركّب → الـ UI بيخفي زر الكاميرا.
 */
function safeImagePicker() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('expo-image-picker');
  } catch {
    return null;
  }
}

interface Props {
  size?: number;
  /** لو true، يطلع modal مباشرة لما المستخدم يضغط على الـ avatar. */
  enableEdit?: boolean;
}

export const AvatarPicker: React.FC<Props> = ({ size = 80, enableEdit = true }) => {
  const t = useTheme();
  const profile = useUserStore((s) => s.profile);
  const setAvatar = useUserStore((s) => s.setAvatar);
  const [open, setOpen] = useState(false);

  const ImagePicker = safeImagePicker();
  const hasImagePicker = ImagePicker !== null;

  // الـ avatar الحالي: data URI/file URI، أو preset (avatarUri يبدأ بـ "preset:")، أو initial
  const isPreset = profile.avatarUri?.startsWith('preset:') ?? false;
  const presetId = isPreset ? profile.avatarUri!.slice('preset:'.length) : null;
  const currentPreset = presetId ? PRESETS.find((p) => p.id === presetId) : null;

  const initial = (profile.name?.trim().charAt(0) || 'ن').toUpperCase();

  const handlePickImage = async () => {
    if (!ImagePicker) {
      Alert.alert('غير متاح', 'لرفع صورة من المعرض، يحتاج التطبيق تركيب expo-image-picker.');
      return;
    }
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('إذن مرفوض', 'يجب السماح بالوصول إلى الصور.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        setAvatar(result.assets[0].uri);
        setOpen(false);
      }
    } catch (e) {
      log.error('image picker failed', { error: String(e) });
    }
  };

  const handleSelectPreset = (p: Preset) => {
    setAvatar(`preset:${p.id}`);
    setOpen(false);
  };

  const handleRemove = () => {
    setAvatar(null);
    setOpen(false);
  };

  // الـ avatar visual: image لو URI، preset color circle، أو initial
  const renderAvatar = () => {
    if (profile.avatarUri && !isPreset) {
      return (
        <Image
          source={{ uri: profile.avatarUri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      );
    }
    const bg = currentPreset?.color ?? t.colors.primary;
    const fg = currentPreset?.textColor ?? '#FFF';
    return (
      <View style={[
        styles.initialCircle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg, borderColor: t.colors.accent },
      ]}>
        <Text style={{ color: fg, fontSize: size * 0.4, fontWeight: '800' }}>{initial}</Text>
      </View>
    );
  };

  return (
    <>
      <Pressable
        onPress={enableEdit ? () => setOpen(true) : undefined}
        accessibilityRole={enableEdit ? 'button' : undefined}
        accessibilityLabel={enableEdit ? 'تغيير صورة الملف الشخصي' : undefined}
        disabled={!enableEdit}
      >
        {renderAvatar()}
        {enableEdit ? (
          <View style={[styles.editBadge, { backgroundColor: t.colors.accent, borderColor: t.colors.background }]}>
            <Camera size={12} color="#0A1815" />
          </View>
        ) : null}
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
          <View style={[styles.modalSheet, { backgroundColor: t.colors.surface, borderColor: t.colors.borderGold }]}>
            <View style={styles.modalDrag} />
            <View style={styles.modalHeader}>
              <Text variant="h3">صورة الملف الشخصي</Text>
              <Pressable onPress={() => setOpen(false)} hitSlop={10}>
                <X size={20} color={t.colors.textSecondary} />
              </Pressable>
            </View>

            <View style={{ alignItems: 'center', marginVertical: 16 }}>
              {renderAvatar()}
            </View>

            {hasImagePicker ? (
              <Pressable
                onPress={handlePickImage}
                accessibilityRole="button"
                accessibilityLabel="اختر من المعرض"
                style={({ pressed }) => [
                  styles.actionBtn,
                  { backgroundColor: t.colors.primary, borderColor: t.colors.accent, opacity: pressed ? 0.88 : 1 },
                ]}
              >
                <ImageIcon size={18} color={t.colors.accent} />
                <Text style={{ color: '#FFF', fontWeight: '800' }}>اختر من المعرض</Text>
              </Pressable>
            ) : null}

            <Text variant="caption" color={t.colors.textSecondary} style={{ textAlign: 'center', marginVertical: 12 }}>
              أو اختر لون من الـ presets
            </Text>

            <View style={styles.presetsGrid}>
              {PRESETS.map((p) => {
                const active = presetId === p.id;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => handleSelectPreset(p)}
                    accessibilityRole="button"
                    accessibilityLabel={p.label}
                    style={({ pressed }) => [
                      styles.presetItem,
                      {
                        backgroundColor: p.color,
                        borderColor: active ? t.colors.accent : 'transparent',
                        opacity: pressed ? 0.85 : 1,
                      },
                    ]}
                  >
                    <Text style={{ color: p.textColor, fontSize: 18, fontWeight: '800' }}>{initial}</Text>
                    {active ? (
                      <View style={[styles.activeCheck, { backgroundColor: t.colors.accent }]}>
                        <Check size={10} color="#0A1815" />
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>

            {profile.avatarUri ? (
              <Pressable
                onPress={handleRemove}
                accessibilityRole="button"
                accessibilityLabel="حذف الصورة"
                style={({ pressed }) => [
                  styles.removeBtn,
                  { borderColor: t.colors.error, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Trash2 size={14} color={t.colors.error} />
                <Text style={{ color: t.colors.error, fontSize: 13, fontWeight: '700' }}>حذف الصورة</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  initialCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    end: 0,
    width: 24, height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  modalDrag: {
    alignSelf: 'center',
    width: 36, height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.18)',
    marginBottom: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginTop: 6,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  presetItem: {
    width: '28%',
    aspectRatio: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    position: 'relative',
  },
  activeCheck: {
    position: 'absolute',
    bottom: 4,
    end: 4,
    width: 18, height: 18,
    borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
});
