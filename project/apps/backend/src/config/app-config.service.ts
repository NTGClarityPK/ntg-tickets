import { Injectable } from '@nestjs/common';
import { ConfigService, ConfigType } from '@nestjs/config';
import configuration from './configuration';

type AppConfig = ConfigType<typeof configuration>;

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService<AppConfig, true>) {}

  get nodeEnv(): string {
    return this.configService.get('nodeEnv', { infer: true });
  }

  get rateLimit(): AppConfig['rateLimit'] {
    return this.configService.get('rateLimit', { infer: true });
  }

  get redis(): AppConfig['redis'] {
    return this.configService.get('redis', { infer: true });
  }

  get jwt(): AppConfig['jwt'] {
    return this.configService.get('jwt', { infer: true });
  }

  get corsOrigins(): string[] {
    return this.configService.get('cors.origins', {
      infer: true,
    });
  }

  get frontendUrl(): string {
    return this.configService.get('frontend.url', { infer: true });
  }

  get databaseUrl(): string {
    return this.configService.get('database.url', { infer: true });
  }

  get elasticsearchUrl(): string {
    return this.configService.get('elasticsearch.url', { infer: true });
  }

  get smtp(): AppConfig['smtp'] {
    return this.configService.get('smtp', { infer: true });
  }

  get maxFileSizeBytes(): number {
    return this.configService.get('file.maxSizeBytes', { infer: true });
  }
}

