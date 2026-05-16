/**
 * 🧠 LRU Cache بسيط - يمنع تسرّب الذاكرة من الـ caches الدائمة.
 *
 * كيف يعمل:
 *   - يحتفظ بآخر N عنصر تمّ الوصول إليه (get أو set).
 *   - عند تجاوز الحدّ، يحذف الأقدم استخداماً.
 *
 * يستخدم خاصية أن JavaScript Map يحافظ على ترتيب الإدراج، فحذف ثم إعادة
 * إدراج يجعل المفتاح "الأحدث".
 */
export class LruCache<K, V> {
  private map = new Map<K, V>();
  constructor(private readonly maxSize: number) {
    if (maxSize <= 0) throw new Error('LruCache: maxSize يجب أن يكون أكبر من صفر');
  }

  get(key: K): V | undefined {
    const v = this.map.get(key);
    if (v === undefined) return undefined;
    // أعد إدراج العنصر ليصبح الأحدث
    this.map.delete(key);
    this.map.set(key, v);
    return v;
  }

  set(key: K, value: V): void {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, value);
    // طرد الأقدم لو تجاوزنا الحدّ
    if (this.map.size > this.maxSize) {
      const oldestKey = this.map.keys().next().value;
      if (oldestKey !== undefined) this.map.delete(oldestKey);
    }
  }

  has(key: K): boolean { return this.map.has(key); }
  delete(key: K): boolean { return this.map.delete(key); }
  clear(): void { this.map.clear(); }
  get size(): number { return this.map.size; }
}
