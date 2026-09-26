const topicRules: Array<[RegExp, string]> = [
  [/mongo|mongodb|database|postgres|sql|pool/i, 'databases'],
  [/react|next\.js|frontend|css|state|routing/i, 'frontend'],
  [/node|javascript|typescript|async|promise|express/i, 'backend'],
  [/docker|deploy|deployment|ci\/cd|linux|server/i, 'infrastructure'],
  [/auth|jwt|oauth|security|permission/i, 'security'],
  [/test|debug|bug|error|failure/i, 'testing-debugging'],
  [/lowisa|system immersion|ownership|audit|clock it|cohort/i, 'lowisa'],
  [/api|rest|graphql/i, 'apis']
];

export function classifyTopic(text: string) {
  for (const [regex, topic] of topicRules) {
    if (regex.test(text)) return topic;
  }
  return 'general';
}
