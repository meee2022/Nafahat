/** Web keeps using the CDN; native builds override this module with .native.ts. */
export function getBundledQpcPage(_page: number): unknown | null {
  return null;
}
