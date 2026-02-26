function parseNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = parseNumber(value, fallback);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseString(value: string | undefined, fallback: string): string {
  return value && value.trim().length > 0 ? value : fallback;
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return fallback;
}

function parseDurationMs(value: string): number {
  const match = /^(\d+)(ms|s|m|h|d)$/.exec(value.trim());
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const n = Number(match[1]);
  switch (match[2]) {
    case 'ms': return n;
    case 's':  return n * 1_000;
    case 'm':  return n * 60_000;
    case 'h':  return n * 3_600_000;
    case 'd':  return n * 86_400_000;
    default:   return 7 * 24 * 60 * 60 * 1000;
  }
}

function parseCsv(value: string | undefined, fallback: string[]): string[] {
  if (!value) return fallback;
  const values = value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
  return values.length > 0 ? values : fallback;
}

const nodeEnv = parseString(process.env.NODE_ENV, 'development');
const isProduction = nodeEnv === 'production';
const defaultJwtSecret = 'dev_only_change_this_jwt_secret';
const defaultDbPassword = 'voley_pass';
const jwtSecret = parseString(process.env.JWT_SECRET, defaultJwtSecret);
const dbPassword = parseString(process.env.DATABASE_PASSWORD, defaultDbPassword);
const dbSynchronize = parseBoolean(process.env.DB_SYNCHRONIZE, false);

export const envConfig = {
  app: {
    port: parseNumber(process.env.PORT, 3000),
    nodeEnv,
    isProduction,
    corsOrigins: parseCsv(process.env.CORS_ORIGINS, ['http://localhost:4200', 'http://localhost:80']),
  },
  database: {
    host: parseString(process.env.DATABASE_HOST, 'localhost'),
    port: parseNumber(process.env.DATABASE_PORT, 5432),
    user: parseString(process.env.DATABASE_USER, 'voley_user'),
    password: dbPassword,
    name: parseString(process.env.DATABASE_NAME, 'voley_app'),
    synchronize: dbSynchronize,
    migrationsRun: parseBoolean(process.env.DB_MIGRATIONS_RUN, true),
    sslEnabled: parseBoolean(process.env.DB_SSL, isProduction),
    sslRejectUnauthorized: parseBoolean(process.env.DB_SSL_REJECT_UNAUTHORIZED, isProduction),
  },
  auth: {
    jwtSecret,
    jwtExpiresIn: parseString(process.env.JWT_EXPIRES_IN, '7d'),
    cookieMaxAgeMs: parseDurationMs(parseString(process.env.JWT_EXPIRES_IN, '7d')),
    jwtIssuer: parseString(process.env.JWT_ISSUER, 'voley-app-backend'),
    jwtAudience: parseString(process.env.JWT_AUDIENCE, 'voley-app-clients'),
    bcryptRounds: parsePositiveInt(process.env.BCRYPT_ROUNDS, 12),
    cookieName: parseString(process.env.AUTH_COOKIE_NAME, 'voley_access_token'),
  },
  notifications: {
    emailProvider: parseString(process.env.NOTIFICATIONS_EMAIL_PROVIDER, 'log'),
    resendApiKey: parseString(process.env.RESEND_API_KEY, ''),
    fromEmail: parseString(process.env.NOTIFICATIONS_FROM_EMAIL, 'VoleyPlay <no-reply@voleyplay.local>'),
    appUrl: parseString(process.env.NOTIFICATIONS_APP_URL, 'http://localhost:4200'),
    streakReminderAutoSendEnabled: parseBoolean(
      process.env.STREAK_REMINDER_AUTOSEND_ENABLED,
      false,
    ),
    streakReminderCron: parseString(process.env.STREAK_REMINDER_CRON, '0 19 * * *'),
    timeZone: parseString(process.env.NOTIFICATIONS_TIMEZONE, 'Europe/Madrid'),
  },
  security: {
    rateLimit: {
      globalTtlMs: parsePositiveInt(process.env.RATE_LIMIT_GLOBAL_TTL_MS, 60_000),
      globalLimit: parsePositiveInt(process.env.RATE_LIMIT_GLOBAL_LIMIT, 120),
      authTtlMs: parsePositiveInt(process.env.RATE_LIMIT_AUTH_TTL_MS, 60_000),
      authLimit: parsePositiveInt(process.env.RATE_LIMIT_AUTH_LIMIT, 8),
    },
  },
};

if (isProduction && jwtSecret === defaultJwtSecret) {
  throw new Error('JWT_SECRET must be set in production');
}

if (isProduction && jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters in production');
}

if (isProduction && dbPassword === defaultDbPassword) {
  throw new Error('DATABASE_PASSWORD must be set in production');
}

if (isProduction && dbSynchronize) {
  throw new Error('DB_SYNCHRONIZE must be false in production');
}

if (
  isProduction &&
  envConfig.app.corsOrigins.some(
    (origin) =>
      origin === '*' || origin.includes('localhost') || origin.includes('127.0.0.1'),
  )
) {
  throw new Error('CORS_ORIGINS must contain only trusted production domains');
}

if (
  envConfig.notifications.emailProvider === 'resend' &&
  !envConfig.notifications.resendApiKey
) {
  throw new Error('RESEND_API_KEY must be set when NOTIFICATIONS_EMAIL_PROVIDER=resend');
}
