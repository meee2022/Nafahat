/**
 * شاشة الأدعية - مجموعة أدعية مصنّفة.
 */
import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, Pressable, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, BookOpen, Copy, Check, Share2 } from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Text, Card, Chip, AppHeader } from '@components/ui';
import { OrnamentalRule } from '@components/ornaments';
import { DUAS, DUA_CATEGORIES } from '@data/duas';
import { useT } from '@store/languageStore';
import { copyToClipboard, shareText } from '@utils/clipboard';

export default function DuasScreen() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  const [category, setCategory] = useState<string>('all');

  const filtered = useMemo(() => {
    if (category === 'all') return DUAS;
    return DUAS.filter((d) => d.category === category);
  }, [category]);

  const renderItem = useCallback(
    ({ item }: { item: typeof DUAS[number] }) => <DuaCard dua={item} />,
    [],
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <View style={{ paddingHorizontal: t.spacing.lg }}>
        <AppHeader onBack={() => router.back()} title={tr('duas.title')} subtitle={tr('duas.subtitle')} />

        {/* الفئات */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: t.spacing.lg }}>
          <Chip label={tr('duas.all')} active={category === 'all'} onPress={() => setCategory('all')} />
          {DUA_CATEGORIES.map((c) => (
            <Chip key={c} label={c} active={category === c} onPress={() => setCategory(c)} />
          ))}
        </View>
      </View>

      {/* قائمة الأدعية - FlatList للأداء على 54 دعاءً */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: t.spacing.lg, paddingBottom: 40, gap: t.spacing.md }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={7}
        removeClippedSubviews
      />
    </View>
  );
}

/** بطاقة دعاء مع نسخ ومشاركة. */
const DuaCard: React.FC<{ dua: typeof DUAS[number] }> = ({ dua }) => {
  const t = useTheme();
  const [copied, setCopied] = useState(false);

  const fullText = `${dua.title}\n\n${dua.body}${dua.source ? `\n\n— ${dua.source}` : ''}\n\nمن تطبيق نَفَحات`;

  const handleCopy = async () => {
    const ok = await copyToClipboard(fullText);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const handleShare = () => shareText(fullText, dua.title);

  return (
    <Card padding={t.spacing.lg} elevation="sm" bordered>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <View style={[styles.iconBox, { backgroundColor: t.colors.accent + '22', borderColor: t.colors.accent }]}>
          <Heart size={16} color={t.colors.accent} />
        </View>
        <Text variant="subtitle" style={{ flex: 1 }}>{dua.title}</Text>
      </View>

      <View style={{ alignItems: 'center', marginBottom: 14 }}>
        <OrnamentalRule width={100} color={t.colors.accent} variant="simple" />
      </View>

      <Text
        variant="body"
        color={t.colors.textPrimary}
        style={{
          fontFamily: t.fontFamilies.arabicQuran,
          fontSize: 18,
          lineHeight: 36,
          textAlign: 'right',
        }}
      >
        {dua.body}
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: t.colors.borderGold }}>
        {dua.source ? (
          <>
            <BookOpen size={12} color={t.colors.accent} />
            <Text variant="caption" color={t.colors.accent}>{dua.source}</Text>
          </>
        ) : null}
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={handleCopy}
          hitSlop={8}
          style={({ pressed }) => [
            styles.smallBtn,
            {
              backgroundColor: copied ? t.colors.success + '20' : t.colors.surfaceAlt,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          {copied ? <Check size={14} color={t.colors.success} /> : <Copy size={14} color={t.colors.textSecondary} />}
        </Pressable>
        <Pressable
          onPress={handleShare}
          hitSlop={8}
          style={({ pressed }) => [
            styles.smallBtn,
            { backgroundColor: t.colors.surfaceAlt, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Share2 size={14} color={t.colors.textSecondary} />
        </Pressable>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  iconBox: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  smallBtn: {
    width: 30, height: 30, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
});
