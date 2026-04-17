import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Estate Commission Tracker API')
    .setDescription(
      'Real-estate transaction lifecycle tracking with automated ' +
        'commission distribution between agency and agents.',
    )
    .setVersion('1.0')
    .addTag('agents', 'Agent management')
    .addTag('transactions', 'Transaction lifecycle')
    .addTag('reports', 'Financial reporting')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Estate Commission API Docs',
  });

  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
