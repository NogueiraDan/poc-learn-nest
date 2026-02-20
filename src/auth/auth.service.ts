/**
 * Auth Service
 *
 * Conceitos NestJS + JWT:
 *
 * 1. Autenticação - Verifica identidade (quem você é)
 * 2. Autorização - Verifica permissões (o que você pode fazer)
 * 3. JWT - JSON Web Token para sessões stateless
 * 4. Bcrypt - Hash de senhas (one-way encryption)
 *
 * Fluxo de Autenticação:
 * 1. Usuário envia email/senha
 * 2. Sistema valida credenciais
 * 3. Sistema gera JWT com informações do usuário
 * 4. Cliente usa JWT em requisições subsequentes
 * 5. Sistema valida JWT e autoriza acesso
 *
 * Por que JWT?
 * - Stateless (não precisa de session storage)
 * - Escalável (funciona em múltiplos servidores)
 * - Autocontido (contém todas as informações necessárias)
 * - Seguro (assinado digitalmente)
 */

import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * Registra um novo usuário
   *
   * Conceitos:
   * - Hash de senha com bcrypt (salt rounds = 10)
   * - Verificação de email único (tratado por Prisma P2002)
   * - Role padrão: MEMBER
   */
  async register(registerDto: RegisterDto) {
    const { name, email, password, role } = registerDto;

    // Hash da senha antes de salvar
    const hashedPassword = await bcrypt.hash(password, 10);

    // Se email já existe, Prisma lança P2002 (unique constraint)
    // O PrismaExceptionFilter vai capturar e retornar 409
    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || UserRole.MEMBER, // Padrão: MEMBER
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        // password NUNCA deve ser retornado
      },
    });

    this.logger.log(`Novo usuário registrado: ${email}`);

    // Gera token JWT automaticamente após registro
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user,
      ...tokens,
    };
  }

  /**
   * Autentica um usuário (Login)
   *
   * Conceitos:
   * - Busca usuário por email
   * - Compara senha hasheada com bcrypt.compare()
   * - Retorna JWT se credenciais válidas
   */
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Busca usuário por email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Valida senha
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    this.logger.log(`Login bem-sucedido: ${email}`);

    // Gera tokens JWT
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    };
  }

  /**
   * Valida um usuário (usado pelo JWT Strategy)
   *
   * Este método é chamado automaticamente quando uma rota protegida é acessada
   * O JWT Strategy extrai o payload do token e chama este método
   */
  async validateUser(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        // password NUNCA incluído
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    return user;
  }

  /**
   * Gera access token e refresh token
   *
   * Access Token:
   * - Curta duração (15min - 1h)
   * - Usado em todas as requisições
   * - Contém informações mínimas do usuário
   *
   * Refresh Token (implementação simplificada):
   * - Longa duração (7-30 dias)
   * - Usado para gerar novos access tokens
   * - Em produção: deve ser armazenado no banco
   */
  private async generateTokens(userId: number, email: string, role: UserRole) {
    const payload = {
      sub: userId, // "sub" (subject) é o padrão JWT para ID do usuário
      email,
      role,
    };

    // Access Token - curta duração
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '1h', // 1 hora
    });

    // Refresh Token - longa duração
    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: '7d', // 7 dias
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600, // segundos (1 hora)
    };
  }

  /**
   * Atualiza access token usando refresh token
   *
   * Nota: Esta é uma implementação simplificada
   * Em produção, você deveria:
   * 1. Armazenar refresh tokens no banco
   * 2. Verificar se foi revogado
   * 3. Implementar token rotation
   */
  async refreshAccessToken(refreshToken: string) {
    try {
      // Verifica se refresh token é válido
      const payload = await this.jwtService.verifyAsync<{
        sub: number;
        email: string;
      }>(refreshToken);

      // Valida se usuário ainda existe
      const user = await this.validateUser(payload.sub);

      // Gera novo access token
      const tokens = await this.generateTokens(user.id, user.email, user.role);

      return tokens;
    } catch {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }
  }
}
