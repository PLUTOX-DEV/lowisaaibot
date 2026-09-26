import { Context } from 'telegraf';

export async function isAdmin(ctx: Context) {
  const from = ctx.from;
  const chat = ctx.chat;
  if (!from || !chat || (chat.type !== 'group' && chat.type !== 'supergroup')) return false;

  try {
    const member = await ctx.telegram.getChatMember(chat.id, from.id);
    return member.status === 'creator' || member.status === 'administrator';
  } catch (error) {
    console.error('Failed to verify Telegram group admin status:', error);
    return false;
  }
}

export function requireAdmin(handler: (ctx: Context) => Promise<unknown>) {
  return async (ctx: Context) => {
    if (!(await isAdmin(ctx))) {
      await ctx.reply('🔒 Only Telegram group admins can use this command.');
      return;
    }
    await handler(ctx);
  };
}
