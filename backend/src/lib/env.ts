import fs from 'node:fs/promises';
import path from 'node:path';

const ENV_LINE = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/;

interface LoadEnvFileOptions {
  overrideExisting?: boolean;
}

const stripWrappingQuotes = (value: string): string => {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
};

export const loadEnvFile = async (
  envFilePath = '.env',
  options: LoadEnvFileOptions = {},
): Promise<void> => {
  const absolutePath = path.resolve(process.cwd(), envFilePath);
  const { overrideExisting = false } = options;

  try {
    const content = await fs.readFile(absolutePath, 'utf8');
    const lines = content.split(/\r?\n/);

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) {
        continue;
      }

      const match = line.match(ENV_LINE);
      if (!match) {
        continue;
      }

      const [, key, rawValue] = match;
      if (!overrideExisting && process.env[key] !== undefined) {
        continue;
      }

      process.env[key] = stripWrappingQuotes(rawValue.trim());
    }
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: string }).code === 'ENOENT'
    ) {
      return;
    }

    throw error;
  }
};
