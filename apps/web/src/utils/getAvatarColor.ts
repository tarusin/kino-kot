const AVATAR_COLORS = [
  '#E06C75',
  '#E5A84B',
  '#61AFEF',
  '#C678DD',
  '#56B6C2',
  '#98C379',
  '#D19A66',
  '#BE5046',
  '#2C6E91',
  '#7C5CBF',
  '#3D8B6E',
  '#C75B8E',
];

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}
