import { InternalServerErrorException, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const PORT = process.env.PORT || 3000;
  const prefix = '/api/v1';

  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix(prefix);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  const docsConfig = new DocumentBuilder()
    .setTitle('Concurreny-aware Boss Raid PVE Contents Backend Service')
    .setDescription('동시성을 고려한 보스레이드 PVE 컨텐츠 백엔드 서비스')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, docsConfig);
  SwaggerModule.setup(`${prefix}/docs`, app, document);

  await app.listen(PORT);

  console.log(`server is running on http://localhost:${PORT}${prefix}`);
  console.log(`api docs: http://localhost:${PORT}${prefix}/docs`);
}
bootstrap();
