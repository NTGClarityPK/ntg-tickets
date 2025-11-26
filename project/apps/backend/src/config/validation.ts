import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().integer().positive().default(4000),
  API_PREFIX: Joi.string().default('api/v1'),
  RATE_LIMIT_TTL: Joi.number().integer().positive().default(60),
  RATE_LIMIT_LIMIT: Joi.number().integer().positive().default(100),
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().integer().positive().default(6379),
  REDIS_PASSWORD: Joi.string().allow('', null),
  CORS_ORIGIN: Joi.string().default('http://localhost:3000'),
  FRONTEND_URL: Joi.string().uri().required(),
  DATABASE_URL: Joi.string().uri().required(),
  ELASTICSEARCH_URL: Joi.string()
    .uri()
    .default('http://localhost:9200'),
  SMTP_HOST: Joi.string().allow('').default(''),
  SMTP_PORT: Joi.number().integer().positive().default(587),
  SMTP_USER: Joi.string().allow('').default(''),
  SMTP_PASS: Joi.string().allow('').default(''),
  MAX_FILE_SIZE: Joi.number().integer().positive().default(10485760),
});

