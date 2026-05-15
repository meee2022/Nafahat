/**
 * Navigation utilities - حلول آمنة للتنقل تتفادى تحذير
 * "The action 'GO_BACK' was not handled by any navigator"
 * عند فتح الشاشة عبر deep-link أو كأول شاشة في الـ stack.
 */
import { useCallback } from 'react';
import { useRouter, type Href } from 'expo-router';

type Router = ReturnType<typeof useRouter>;

/**
 * يرجع للشاشة السابقة لو فيه history، وإلا يعمل replace للمسار البديل.
 */
export function safeBack(router: Router, fallback: Href = '/') {
  if (router.canGoBack?.()) router.back();
  else router.replace(fallback);
}

/**
 * Hook لإرجاع callback آمن للزر "رجوع".
 * استخدمه بدل router.back() المباشر.
 *
 * @example
 *   const goBack = useSafeBack('/mushaf');
 *   <Pressable onPress={goBack} />
 */
export function useSafeBack(fallback: Href = '/') {
  const router = useRouter();
  return useCallback(() => safeBack(router, fallback), [router, fallback]);
}
