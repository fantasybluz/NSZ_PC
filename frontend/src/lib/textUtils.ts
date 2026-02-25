export const normalizeLower = (value: string): string => {
  return value.trim().toLowerCase();
};

export const dedupeCaseInsensitive = (values: string[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];

  values.forEach((value) => {
    const trimmed = value.trim();
    const key = normalizeLower(trimmed);
    if (!trimmed || seen.has(key)) {
      return;
    }

    seen.add(key);
    result.push(trimmed);
  });

  return result;
};
