export default () => {
  const corsOrigins =
    process.env.CORS_ORIGIN ??
    'http://localhost:3000'; /* default local frontend */

  const parsedCorsOrigins = corsOrigins
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

  return {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    rateLimit: {
      ttlSeconds: parseInt(process.env.RATE_LIMIT_TTL ?? '60', 10),
      limit: parseInt(process.env.RATE_LIMIT_LIMIT ?? '100', 10),
    },
    redis: {
      host: process.env.REDIS_HOST ?? 'localhost',
      port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
      password: process.env.REDIS_PASSWORD ?? '',
    },
    jwt: {
      secret: process.env.JWT_SECRET ?? 'change-me',
      expiresIn: process.env.JWT_EXPIRES_IN ?? '24h',
    },
    cors: {
      origins: parsedCorsOrigins.length > 0 ? parsedCorsOrigins : ['http://localhost:3000'],
    },
    frontend: {
      url: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    },
    database: {
      url: process.env.DATABASE_URL ?? '',
    },
    elasticsearch: {
      url: process.env.ELASTICSEARCH_URL ?? 'http://localhost:9200',
    },
    smtp: {
      host: process.env.SMTP_HOST ?? '',
      port: parseInt(process.env.SMTP_PORT ?? '587', 10),
      user: process.env.SMTP_USER ?? '',
      pass: process.env.SMTP_PASS ?? '',
    },
    file: {
      maxSizeBytes: parseInt(process.env.MAX_FILE_SIZE ?? '10485760', 10),
    },
  };
};

