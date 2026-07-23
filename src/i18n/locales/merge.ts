export type PartialTranslation<T> = {
  [K in keyof T]?: T[K] extends Record<string, unknown> ? PartialTranslation<T[K]> : T[K];
};

export function mergeTranslations<T extends Record<string, unknown>>(
  base: T,
  overrides: PartialTranslation<T>,
): T {
  const result: Record<string, unknown> = { ...base };

  Object.entries(overrides).forEach(([key, value]) => {
    const baseValue = base[key];
    if (
      value &&
      baseValue &&
      typeof value === 'object' &&
      typeof baseValue === 'object' &&
      !Array.isArray(value) &&
      !Array.isArray(baseValue)
    ) {
      result[key] = mergeTranslations(
        baseValue as Record<string, unknown>,
        value as PartialTranslation<Record<string, unknown>>,
      );
      return;
    }

    result[key] = value;
  });

  return result as T;
}
