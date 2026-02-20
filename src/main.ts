/**
 * Main - Ponto de entrada da aplicação
 *
 * Fase 3 - Validação Global:
 * - ValidationPipe: Valida automaticamente todos os DTOs
 * - whitelist: Remove propriedades não definidas nos DTOs
 * - forbidNonWhitelisted: Retorna erro 400 se propriedades extras forem enviadas
 * - transform: Transforma payloads em instâncias dos DTOs
 *
 * Fase 3 - Exception Filters:
 * - HttpExceptionFilter: Formata exceções HTTP de forma consistente
 * - PrismaExceptionFilter: Captura e trata erros específicos do Prisma
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter, PrismaExceptionFilter } from './common/filters';
import { LoggingInterceptor, TimeoutInterceptor } from './common/interceptors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Segurança: Helmet - Define headers HTTP seguros
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [`'self'`],
          styleSrc: [`'self'`, `'unsafe-inline'`, 'cdnjs.cloudflare.com'],
          scriptSrc: [`'self'`, `'unsafe-inline'`, 'cdnjs.cloudflare.com'],
          imgSrc: [`'self'`, 'data:', 'nestjs.com'],
        },
      },
    }),
  );

  // Segurança: CORS - Controla quem pode acessar a API
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*', // Em produção, definir domínios específicos
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  // API Versioning - Habilita versionamento via URI
  // Exemplo: /v1/books, /v2/books
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1', // Versão padrão se não especificada
  });

  // Configuração global de validação
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove propriedades não definidas no DTO
      forbidNonWhitelisted: true, // Retorna erro se propriedades extras forem enviadas
      transform: true, // Transforma payloads em instâncias dos DTOs (com tipos corretos)
      transformOptions: {
        enableImplicitConversion: true, // Converte tipos automaticamente (string -> number)
      },
    }),
  );

  // Configuração global de exception filters
  // Ordem importa: PrismaExceptionFilter primeiro, depois HttpExceptionFilter
  app.useGlobalFilters(new PrismaExceptionFilter());
  app.useGlobalFilters(new HttpExceptionFilter());

  // Configuração global de interceptors
  app.useGlobalInterceptors(new LoggingInterceptor()); // Logging de todas as requisições
  app.useGlobalInterceptors(new TimeoutInterceptor()); // Timeout de 30s
  // TransformInterceptor desabilitado por padrão (pode quebrar Swagger responses)
  // app.useGlobalInterceptors(new TransformInterceptor());

  // Configuração do Swagger
  const config = new DocumentBuilder()
    .setTitle('Library Management API')
    .setDescription(
      'API completa para gerenciamento de biblioteca - Sistema de empréstimos, reservas, multas e muito mais',
    )
    .setVersion('1.0')
    .addTag('Auth', 'Autenticação e autorização')
    .addTag('Users', 'Gerenciamento de usuários')
    .addTag('Books', 'Gerenciamento de livros')
    .addTag('Authors', 'Gerenciamento de autores')
    .addTag('Categories', 'Gerenciamento de categorias')
    .addTag('Loans', 'Empréstimos de livros')
    .addTag('Reservations', 'Reservas de livros')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // This name here is important for matching up with @ApiBearerAuth() in your controllers!
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Library API Docs',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.js',
    ],
    customCssUrl: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.css',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.css',
    ],
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log(
    `🚀 Aplicação rodando em http://localhost:${process.env.PORT ?? 3000}`,
  );
  console.log(
    `📚 Documentação Swagger: http://localhost:${process.env.PORT ?? 3000}/api/docs`,
  );
}
bootstrap();
