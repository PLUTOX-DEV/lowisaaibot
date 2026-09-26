import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { Raid } from '../models/Raid.js';

export async function getCommunityStats(chatId?: string) {
  const match = chatId ? { chatId } : {};
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [members, messages, questions, activeUsers, activeRaids, topLearners] = await Promise.all([
    User.countDocuments(),
    Message.countDocuments({ ...match, createdAt: { $gte: sevenDaysAgo } }),
    Message.countDocuments({ ...match, isQuestion: true, createdAt: { $gte: sevenDaysAgo } }),
    Message.distinct('userId', { ...match, createdAt: { $gte: sevenDaysAgo } }),
    Raid.countDocuments({ ...(chatId ? { chatId } : {}), status: 'active' }),
    User.find().sort({ questionCount: -1, challengeCount: -1, lastActiveAt: -1 }).limit(5)
      .select('username firstName questionCount challengeCount')
      .lean()
  ]);

  const topTopics = await Message.aggregate([
    { $match: { ...match, createdAt: { $gte: sevenDaysAgo }, isQuestion: true, topic: { $exists: true, $ne: '' } } },
    { $group: { _id: '$topic', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]);

  const todayMessages = await Message.countDocuments({ ...match, createdAt: { $gte: today } });

  return {
    members,
    activeUsers7d: activeUsers.length,
    messages7d: messages,
    questions7d: questions,
    messagesToday: todayMessages,
    activeRaids,
    topTopics: topTopics.map((x) => ({ topic: x._id, count: x.count })),
    topLearners: topLearners.map((user) => ({
      name: user.username ? `@${user.username}` : user.firstName ?? 'Learner',
      questions: user.questionCount,
      challenges: user.challengeCount
    }))
  };
}

export function formatStats(stats: Awaited<ReturnType<typeof getCommunityStats>>) {
  const topics = stats.topTopics.length
    ? stats.topTopics.map((x, i) => `${i + 1}. ${x.topic} — ${x.count}`).join('\n')
    : 'No classified questions yet.';

  return [
    '📊 LoWisa Community Report',
    '',
    `👥 Known members: ${stats.members}`,
    `🔥 Active users (7d): ${stats.activeUsers7d}`,
    `💬 Messages today: ${stats.messagesToday}`,
    `🗓️ Messages (7d): ${stats.messages7d}`,
    `🧠 AI questions (7d): ${stats.questions7d}`,
    `🚀 Active raids: ${stats.activeRaids}`,
    '',
    'Most discussed topics (7d):',
    topics,
    '',
    'Top learners:',
    stats.topLearners.length
      ? stats.topLearners.map((learner, i) => `${i + 1}. ${learner.name} — ${learner.questions} questions, ${learner.challenges} challenges`).join('\n')
      : 'No learner activity yet.'
  ].join('\n');
}
