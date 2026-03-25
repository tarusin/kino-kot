export function getMoviePath(compositeId: string): string {
  if (compositeId.startsWith('series-')) return `/series/${compositeId}`;
  if (compositeId.startsWith('cartoon-')) return `/cartoons/${compositeId}`;
  return `/films/${compositeId}`;
}
