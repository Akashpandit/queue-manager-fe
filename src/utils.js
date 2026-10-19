// Backend dates arrive without a "Z"; treat them as UTC.
export function parseDate(value) {
  if (!value) return null;
  const hasZone = /(Z|[+-]\d\d:?\d\d)$/.test(value);
  return new Date(hasZone ? value : `${value}Z`);
}

export function minutesSince(value) {
  const d = parseDate(value);
  if (!d) return 0;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 60000));
}