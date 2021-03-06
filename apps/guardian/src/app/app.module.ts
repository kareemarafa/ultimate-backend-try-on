import { MiddlewareConsumer, Module } from '@nestjs/common';
import { BootstrapModule } from '@ultimate-backend/bootstrap';
import * as path from 'path';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthGuard, IdentityMiddleware, KratosModule } from '@ub-boilerplate/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { BullConfig, GqlConfigProvider, KratosClassConfig } from './common';
import { APP_GUARD } from '@nestjs/core';
import { OauthModule } from './oauth/oauth.module';
import { PasswordModule } from './password/password.module';
import { SessionsModule } from './sessions/sessions.module';
import { SecurityModule } from './security/security.module';
import { AccountsModule } from './accounts/accounts.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { RedisModule } from '@ultimate-backend/redis';
import { GraphQLFederationModule } from '@nestjs/graphql';
import { BullModule } from '@nestjs/bull';
import { ConfigSource } from '@ultimate-backend/common';
import { ConfigModule } from '@ultimate-backend/config';
import { AppResolver } from './app.resolver';
import { FormsModule } from './forms/forms.module';
import { MikroOrmModule } from '@ub-boilerplate/common/database/mikro-orm';
import { PermissionsModule } from '@ultimate-backend/permissions';
import { PermissionsConfig } from './common/permissions.config';
import { MikroDBConfig } from './common/mikrodb-config';

@Module({
  imports: [
    MikroOrmModule.forRootAsync({
      useClass: MikroDBConfig,
    }),
    KratosModule.forRootAsync({
      useClass: KratosClassConfig,
    }),
    PrometheusModule.register({
      path: 'mymetrics',
      defaultMetrics: {
        enabled: false,
      },
    }),
    GraphQLFederationModule.forRootAsync({
      useClass: GqlConfigProvider,
    }),
    ConfigModule.forRoot({
      global: true,
      load: [
        {
          source: ConfigSource.File,
          filePath: path.resolve(__dirname, 'assets/config.yaml'),
        },
        {
          source: ConfigSource.Env,
          prefix: 'ULTIMATE_BACKEND',
        },
      ],
    }),
    BullModule.forRootAsync({
      useClass: BullConfig,
    }),
    RedisModule.forRoot({ useCluster: false }),
    ThrottlerModule.forRoot({
      ttl: 60000,
      limit: 3,
    }),
    BootstrapModule.forRoot({
      filePath: path.resolve(__dirname, 'assets/bootstrap.yaml'),
      enableEnv: true,
    }),
    PermissionsModule.forRootAsync({
      useClass: PermissionsConfig,
    }),
    AccountsModule,
    SessionsModule,
    SecurityModule,
    PasswordModule,
    OauthModule,
    FormsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AppResolver,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(IdentityMiddleware).forRoutes(':splat*');
  }
}
