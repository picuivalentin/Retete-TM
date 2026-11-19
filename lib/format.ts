export function formatMinutes(minutes: number | null) {
  if (minutes == null) return null;
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

export function formatServings(servings: number | null, yieldText: string | null) {
  if (yieldText) return yieldText;
  if (servings == null) return null;
  return servings === 1 ? "1 porție" : `${servings} porții`;
}
