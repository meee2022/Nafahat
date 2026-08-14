import type { MutationCtx, QueryCtx } from './_generated/server';

type AuthCtx = QueryCtx | MutationCtx;

/** Resolve the only valid storage owner from a live server-side session. */
export async function requireOwnerKey(ctx: AuthCtx, token: string): Promise<string> {
  const session = await ctx.db
    .query('authSessions')
    .withIndex('by_token', (q) => q.eq('token', token))
    .first();

  if (!session || session.expiresAt <= Date.now()) {
    throw new Error('not-authenticated');
  }

  const user = await ctx.db.get(session.userId);
  if (!user) throw new Error('not-authenticated');
  return `user:${user._id}`;
}

export async function assertOwnedRecord(
  ctx: AuthCtx,
  token: string,
  record: { deviceId: string } | null,
): Promise<string> {
  const ownerKey = await requireOwnerKey(ctx, token);
  if (!record || record.deviceId !== ownerKey) throw new Error('forbidden');
  return ownerKey;
}
