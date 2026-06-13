/**
 * 👥 إدارة المستخدمين - شاشة فرعية في لوحة الأدمن.
 *
 * تعرض كل الحسابات المسجّلة في Convex مع إمكانية:
 *   - بحث بالاسم/البريد
 *   - فلترة (admin / user)
 *   - حذف حساب (مع تأكيد)
 *   - عرض إحصائيات (إجمالي، أدمنز، آخر تسجيل)
 *
 * المتطلبات:
 *   - Convex متصل (CONVEX_URL في .env)
 *   - المستخدم الحالي أدمن
 */
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { TOP_BAR_PAD } from '@utils/safeArea';
import {
  ArrowRight, Shield, Users, Trash2, Search, Lock, Crown, UserCheck,
  RefreshCw, Cloud, CloudOff, AlertCircle, Calendar as CalIcon,
} from 'lucide-react-native';
import { useTheme } from '@theme/index';
import { Text, Card } from '@components/ui';
import { useAuthStore } from '@store/authStore';
import { useIsAdmin } from '@store/appConfigStore';
import { convex, convexApi, isCloudEnabled } from '@services/convex';

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  joinedAt: number;
  lastLoginAt?: number;
}

export default function AdminUsersScreen() {
  const t = useTheme();
  const router = useRouter();
  const authUser = useAuthStore((s) => s.user);
  const authToken = useAuthStore((s) => s.token);
  const isAdmin = useIsAdmin(authUser?.email);

  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    if (!authToken) {
      setError('غير مسجّل دخول');
      return;
    }
    if (!isCloudEnabled() || !convex || !convexApi?.users) {
      setError('Convex غير متصل - تحقق من EXPO_PUBLIC_CONVEX_URL');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await convex.query(convexApi.users.listAllUsers, { token: authToken });
      if (result === null) {
        setError('غير مصرّح - فقط الأدمن يقدر يشوف القائمة');
        setUsers([]);
      } else {
        setUsers(result);
      }
    } catch (e: any) {
      setError(e?.message ?? 'حدث خطأ غير متوقّع');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin]);

  const handleDelete = (user: UserRow) => {
    if (user.role === 'admin') {
      Alert.alert('غير مسموح', 'لا يمكن حذف حساب أدمن من هنا. أزل صلاحية الأدمن أولاً ثم احذف.');
      return;
    }
    Alert.alert(
      'تأكيد الحذف',
      `هل تريد حذف حساب "${user.name}" (${user.email})؟\nسيتم حذف كل بياناته بشكل دائم.`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            if (!authToken || !convex || !convexApi?.users) return;
            setDeletingId(user.id);
            try {
              await convex.mutation(convexApi.users.deleteUser, {
                token: authToken,
                targetUserId: user.id as any,
              });
              await fetchUsers();
            } catch (e: any) {
              Alert.alert('فشل الحذف', e?.message ?? 'حدث خطأ');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  // وصول مرفوض
  if (!isAdmin) {
    return (
      <View style={[styles.deniedWrap, { backgroundColor: t.colors.background }]}>
        <View style={[styles.deniedIcon, { backgroundColor: t.colors.error + '14', borderColor: t.colors.error }]}>
          <Shield size={32} color={t.colors.error} />
        </View>
        <Text variant="h2" align="center" style={{ marginTop: 18 }}>وصول مرفوض</Text>
        <Text variant="body" color={t.colors.textSecondary} align="center" style={{ marginTop: 8, paddingHorizontal: 30 }}>
          هذه الصفحة مخصّصة لمشرف التطبيق فقط.
        </Text>
        <Pressable
          onPress={() => router.replace('/(tabs)/account')}
          style={[styles.backBtn, { backgroundColor: t.colors.primary, marginTop: 24 }]}
        >
          <Text style={{ color: t.colors.onPrimary, fontWeight: '700' }}>عودة لحسابي</Text>
        </Pressable>
      </View>
    );
  }

  const filtered = (users ?? []).filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase().trim();
    return u.email.toLowerCase().includes(q) || u.name.toLowerCase().includes(q);
  });

  const adminCount = (users ?? []).filter((u) => u.role === 'admin').length;
  const userCount = (users ?? []).filter((u) => u.role === 'user').length;

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      {/* Header */}
      <View style={[styles.topBar, { borderBottomColor: t.colors.borderGold }]}>
        <Pressable
          onPress={() => {
            if (router.canGoBack?.()) router.back();
            else router.replace('/admin');
          }}
          hitSlop={10}
          style={[styles.iconBtn, { borderColor: t.colors.border }]}
        >
          <ArrowRight size={18} color={t.colors.textPrimary} strokeWidth={1.6} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Users size={14} color={t.colors.accent} />
            <Text style={[styles.eyebrow, { color: t.colors.accent }]}>الإدارة</Text>
          </View>
          <Text style={[styles.topTitle, { color: t.colors.textPrimary }]}>إدارة المستخدمين</Text>
        </View>
        <Pressable
          onPress={fetchUsers}
          hitSlop={10}
          style={[styles.iconBtn, { borderColor: t.colors.border }]}
          disabled={loading}
        >
          <RefreshCw size={16} color={t.colors.accent} strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 60 }}>

        {/* بطاقات الإحصائيات */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          <StatCard
            icon={<Users size={18} color={t.colors.primary} />}
            value={(users?.length ?? 0).toString()}
            label="إجمالي"
            color={t.colors.primary}
          />
          <StatCard
            icon={<Crown size={18} color={t.colors.accent} />}
            value={adminCount.toString()}
            label="أدمن"
            color={t.colors.accent}
          />
          <StatCard
            icon={<UserCheck size={18} color={t.colors.info} />}
            value={userCount.toString()}
            label="مستخدم"
            color={t.colors.info}
          />
        </View>

        {/* حالة الاتصال السحابي */}
        <Card padding={12} elevation="xs" bordered style={{ marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {isCloudEnabled() ? (
              <>
                <View style={[styles.statusDot, { backgroundColor: t.colors.success }]} />
                <Cloud size={16} color={t.colors.success} />
                <Text style={{ fontSize: 12, color: t.colors.textSecondary, flex: 1 }}>
                  متصل بـ Convex - الحسابات في السحابة
                </Text>
              </>
            ) : (
              <>
                <View style={[styles.statusDot, { backgroundColor: t.colors.error }]} />
                <CloudOff size={16} color={t.colors.error} />
                <Text style={{ fontSize: 12, color: t.colors.textSecondary, flex: 1 }}>
                  غير متصل - لن تظهر الحسابات
                </Text>
              </>
            )}
          </View>
        </Card>

        {/* بحث */}
        <View style={[styles.searchBox, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}>
          <Search size={16} color={t.colors.textTertiary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="ابحث بالاسم أو البريد..."
            placeholderTextColor={t.colors.textTertiary}
            style={{ flex: 1, color: t.colors.textPrimary, fontSize: 14, textAlign: 'right' }}
          />
        </View>

        {/* فلاتر الـ role */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, marginBottom: 14 }}>
          <FilterChip label="الكل" active={roleFilter === 'all'} onPress={() => setRoleFilter('all')} color={t.colors.primary} />
          <FilterChip label="الأدمن" active={roleFilter === 'admin'} onPress={() => setRoleFilter('admin')} color={t.colors.accent} icon={<Crown size={12} color={roleFilter === 'admin' ? '#fff' : t.colors.accent} />} />
          <FilterChip label="مستخدمين" active={roleFilter === 'user'} onPress={() => setRoleFilter('user')} color={t.colors.info} icon={<UserCheck size={12} color={roleFilter === 'user' ? '#fff' : t.colors.info} />} />
        </View>

        {/* الحالات */}
        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={t.colors.accent} size="large" />
            <Text variant="bodySm" color={t.colors.textSecondary} style={{ marginTop: 10 }}>
              جاري التحميل من Convex...
            </Text>
          </View>
        ) : error ? (
          <View style={[styles.errorBox, { backgroundColor: t.colors.error + '12', borderColor: t.colors.error }]}>
            <AlertCircle size={18} color={t.colors.error} />
            <Text style={{ flex: 1, fontSize: 13, color: t.colors.error, fontWeight: '600' }}>
              {error}
            </Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.centerState}>
            <Users size={42} color={t.colors.textTertiary} strokeWidth={1.4} />
            <Text variant="bodySm" color={t.colors.textSecondary} style={{ marginTop: 12 }}>
              {query || roleFilter !== 'all'
                ? 'لا توجد نتائج مطابقة'
                : 'لا يوجد مستخدمين مسجّلين بعد'}
            </Text>
          </View>
        ) : (
          /* قائمة المستخدمين */
          <View style={{ gap: 8 }}>
            {filtered.map((u) => {
              const isCurrentUser = u.email === (authUser?.email ?? '').toLowerCase();
              const isAdminUser = u.role === 'admin';
              const isDeleting = deletingId === u.id;
              return (
                <Card
                  key={u.id}
                  padding={14}
                  elevation="xs"
                  bordered
                  background={isAdminUser ? t.colors.accent + '06' : undefined}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    {/* avatar */}
                    <View style={[styles.avatar, { backgroundColor: isAdminUser ? t.colors.accent + '22' : t.colors.primary + '22' }]}>
                      <Text style={{
                        fontSize: 18,
                        fontWeight: '800',
                        color: isAdminUser ? t.colors.accent : t.colors.primary,
                      }}>
                        {(u.name ?? u.email).charAt(0).toUpperCase()}
                      </Text>
                    </View>

                    {/* info */}
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text style={{ fontSize: 14, fontWeight: '800', color: t.colors.textPrimary }}>
                          {u.name}
                        </Text>
                        {isAdminUser ? (
                          <View style={[styles.roleBadge, { backgroundColor: t.colors.accent + '20' }]}>
                            <Crown size={9} color={t.colors.accent} />
                            <Text style={{ fontSize: 9, fontWeight: '800', color: t.colors.accent }}>أدمن</Text>
                          </View>
                        ) : null}
                        {isCurrentUser ? (
                          <View style={[styles.roleBadge, { backgroundColor: t.colors.success + '20' }]}>
                            <Text style={{ fontSize: 9, fontWeight: '800', color: t.colors.success }}>أنت</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={{ fontSize: 11, color: t.colors.textSecondary, marginTop: 2 }} numberOfLines={1}>
                        {u.email}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <CalIcon size={10} color={t.colors.textTertiary} />
                        <Text style={{ fontSize: 10, color: t.colors.textTertiary }}>
                          انضم {formatDate(u.joinedAt)}
                        </Text>
                        {u.lastLoginAt ? (
                          <>
                            <Text style={{ fontSize: 10, color: t.colors.textTertiary }}>·</Text>
                            <Text style={{ fontSize: 10, color: t.colors.textTertiary }}>
                              آخر دخول {formatRelative(u.lastLoginAt)}
                            </Text>
                          </>
                        ) : null}
                      </View>
                    </View>

                    {/* delete btn */}
                    {isAdminUser ? (
                      <View style={[styles.actionBtn, { backgroundColor: t.colors.warning + '14', borderColor: t.colors.warning + '40' }]}>
                        <Lock size={14} color={t.colors.warning} />
                      </View>
                    ) : isCurrentUser ? null : (
                      <Pressable
                        onPress={() => handleDelete(u)}
                        disabled={isDeleting}
                        style={[styles.actionBtn, {
                          backgroundColor: t.colors.error + '14',
                          borderColor: t.colors.error + '40',
                          opacity: isDeleting ? 0.5 : 1,
                        }]}
                      >
                        {isDeleting ? (
                          <ActivityIndicator size="small" color={t.colors.error} />
                        ) : (
                          <Trash2 size={14} color={t.colors.error} />
                        )}
                      </Pressable>
                    )}
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const StatCard: React.FC<{ icon: React.ReactNode; value: string; label: string; color: string }> = ({
  icon, value, label, color,
}) => {
  const t = useTheme();
  return (
    <View style={[styles.statCard, { backgroundColor: color + '0E', borderColor: color + '30' }]}>
      {icon}
      <Text style={{ fontSize: 20, fontWeight: '900', color, marginTop: 4 }}>{value}</Text>
      <Text style={{ fontSize: 10, fontWeight: '600', color: t.colors.textSecondary, marginTop: 2 }}>{label}</Text>
    </View>
  );
};

const FilterChip: React.FC<{
  label: string;
  active: boolean;
  onPress: () => void;
  color: string;
  icon?: React.ReactNode;
}> = ({ label, active, onPress, color, icon }) => {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.filterChip,
        {
          backgroundColor: active ? color : t.colors.surface,
          borderColor: active ? color : t.colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      {icon}
      <Text style={{
        fontSize: 12,
        fontWeight: '700',
        color: active ? '#fff' : t.colors.textSecondary,
      }}>
        {label}
      </Text>
    </Pressable>
  );
};

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'الآن';
  if (min < 60) return `منذ ${min} د`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `منذ ${hr} س`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `منذ ${day} يوم`;
  return formatDate(ts);
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: TOP_BAR_PAD, paddingBottom: 14,
    gap: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  eyebrow: { fontSize: 10, fontWeight: '700' },
  topTitle: { fontSize: 16, fontWeight: '700', marginTop: 2 },

  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },

  statusDot: { width: 8, height: 8, borderRadius: 4 },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },

  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },

  centerState: {
    alignItems: 'center',
    paddingVertical: 40,
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },

  avatar: {
    width: 44, height: 44,
    borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },

  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },

  actionBtn: {
    width: 36, height: 36,
    borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },

  // وصول مرفوض
  deniedWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  deniedIcon: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2,
  },
  backBtn: {
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999,
  },
});
