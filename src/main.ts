import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ConfigService
  const configService = app.get(ConfigService);

  const port = configService.get<number>('PORT') || 3000;

  await app.listen(port);

  //console.log(`Application is running on http://localhost:${port}`);
  //console.log(`Google API Key loaded: ${!!configService.get('GOOGLE_API_KEY')}`);
  //console.log(`MongoDB URI loaded: ${!!configService.get('MONGO_URI')}\n`);
}

bootstrap();
