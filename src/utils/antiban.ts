import type { AntiBanConfig } from 'baileys-antiban';

const parseNumber = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const parseBool = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
};

export function isAntibanEnabledFor(instanceName: string): boolean {
  if (!parseBool(process.env.ANTIBAN_ENABLED, false)) return false;
  const list = (process.env.ANTIBAN_ENABLED_INSTANCES || '').trim();
  if (list === '*' || list === '') return parseBool(process.env.ANTIBAN_ENABLED, false);
  return list
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .includes(instanceName);
}

export function buildAntibanConfig(instanceName: string): AntiBanConfig {
  return {
    rateLimiter: {
      maxPerMinute: parseNumber(process.env.ANTIBAN_MAX_PER_MINUTE, 2),
      maxPerHour: parseNumber(process.env.ANTIBAN_MAX_PER_HOUR, 25),
      maxPerDay: parseNumber(process.env.ANTIBAN_MAX_PER_DAY, 150),
      minDelayMs: parseNumber(process.env.ANTIBAN_MIN_DELAY_MS, 90_000),
      maxDelayMs: parseNumber(process.env.ANTIBAN_MAX_DELAY_MS, 270_000),
    },
    warmUp: {
      warmUpDays: parseNumber(process.env.ANTIBAN_WARMUP_DAYS, 7),
    },
    presence: {
      enabled: parseBool(process.env.ANTIBAN_PRESENCE, true),
      enableCircadianRhythm: parseBool(process.env.ANTIBAN_CIRCADIAN, true),
      timezone: process.env.ANTIBAN_TIMEZONE || 'America/Sao_Paulo',
      activityCurve: (process.env.ANTIBAN_ACTIVITY_CURVE as 'office' | 'social' | 'global') || 'office',
    },
    replyRatio: {
      enabled: parseBool(process.env.ANTIBAN_REPLY_RATIO, true),
      minRatio: parseNumber(process.env.ANTIBAN_REPLY_MIN_RATIO, 0.1),
      minMessagesBeforeEnforce: parseNumber(process.env.ANTIBAN_REPLY_MIN_MSGS, 5),
      cooldownHoursOnViolation: parseNumber(process.env.ANTIBAN_REPLY_COOLDOWN_HOURS, 24),
    },
    reconnectThrottle: {
      enabled: parseBool(process.env.ANTIBAN_RECONNECT_THROTTLE, true),
    },
    sessionStability: {
      enabled: parseBool(process.env.ANTIBAN_SESSION_STABILITY, true),
      canonicalJidNormalization: true,
      healthMonitoring: true,
    },
    lidResolver: {
      canonical: 'pn',
      maxEntries: 10_000,
    },
    jidCanonicalizer: {
      enabled: true,
      canonical: 'pn',
    },
    health: {
      autoPauseAt: (process.env.ANTIBAN_AUTOPAUSE_AT as 'low' | 'medium' | 'high' | 'critical') || 'high',
      onRiskChange: (status) => {
        console.log(`[antiban:${instanceName}] risk=${status.risk} score=${status.score} :: ${status.recommendation}`);
      },
    },
    logging: parseBool(process.env.ANTIBAN_LOGGING, true),
  };
}
