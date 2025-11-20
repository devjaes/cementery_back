import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ResponseInterceptor } from './common/interceptors/response.interceptor/response.interceptor';
import 'dotenv/config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Serve uploads folder as static so files saved in /uploads are accessible via HTTP
  const uploadsPath = path.join(process.cwd(), 'uploads');
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads/',
  });
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.enableCors({
    origin: '*', // Permite todas las peticiones (puedes cambiarlo a un dominio específico)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Authorization',
  });

  const config = new DocumentBuilder()
    .setTitle('Cementerios API')
    .setDescription(
      'Documentacion de la API del Sistema de control de Cementerios en Pillaro\n\nDesarrollado por estudiantes de Software de Septimo Semestre\n\n**NOTA: Para poder realizar peticiones a la API, es necesario estar autenticado en algunos modulos de momento.**',
    )
    .setVersion('1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
