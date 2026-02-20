/**
 * Auth Module
 *
 * Conceitos de Módulos de Autenticação:
 *
 * 1. JwtModule.register() - Configura JWT
 * 2. PassportModule - Integração com Passport
 * 3. Providers - Services, Strategies, Guards
 * 4. Exports - Disponibiliza para outros módulos
 *
 * Este módulo:
 * - Registra JwtStrategy com Passport
 * - Configura JWT com secret e expiração
 * - Exporta AuthService e Guards para uso em outros módulos
 *
 * Dependências:
 * - PrismaModule (para acesso ao banco)
 * - JwtModule (para gerar/validar tokens)
 * - PassportModule (para estratégias de autenticação)
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    // PassportModule - Base para estratégias de autenticação
    PassportModule,

    // JwtModule - Configuração do JWT
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'seu-secret-super-seguro',
      signOptions: {
        expiresIn: '1h', // Access token expira em 1 hora
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy, // Registra a estratégia JWT com Passport
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [
    AuthService,
    JwtAuthGuard,
    RolesGuard,
    // Exporta para outros módulos poderem usar
  ],
})
export class AuthModule {}
