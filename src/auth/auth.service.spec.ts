import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { LoginDto, RegisterDto } from './dto';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// Mock do bcrypt
jest.mock('bcrypt');

/**
 * Testes Unitários do AuthService
 *
 * Cobertura:
 * - Registro de novos usuários
 * - Login com validação de credenciais
 * - Hash de senhas com bcrypt
 * - Geração de JWT tokens
 * - Validação de usuários
 * - Refresh de access tokens
 * - Tratamento de erros de autenticação
 */
describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  // Mock do PrismaService
  const mockPrismaService = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  // Mock do JwtService
  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      name: 'João Silva',
      email: 'joao@example.com',
      password: 'senha123',
      role: UserRole.MEMBER,
    };

    const hashedPassword = 'hashed_senha123';

    const mockCreatedUser = {
      id: 1,
      name: registerDto.name,
      email: registerDto.email,
      role: UserRole.MEMBER,
      createdAt: new Date(),
    };

    it('deve registrar novo usuário com sucesso', async () => {
      // Arrange
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      // Mock retorna sem password porque o service usa select que exclui password
      mockPrismaService.user.create.mockResolvedValue(mockCreatedUser);
      mockJwtService.signAsync
        .mockResolvedValueOnce('access_token_mock')
        .mockResolvedValueOnce('refresh_token_mock');

      // Act
      const result = await service.register(registerDto);

      // Assert
      expect(result.user).toEqual(mockCreatedUser);
      expect(result.accessToken).toBe('access_token_mock');
      expect(result.refreshToken).toBe('refresh_token_mock');
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          name: registerDto.name,
          email: registerDto.email,
          password: hashedPassword,
          role: UserRole.MEMBER,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });
    });

    it('deve usar role padrão MEMBER quando não fornecido', async () => {
      // Arrange
      const dtoWithoutRole = {
        name: 'João Silva',
        email: 'joao@example.com',
        password: 'senha123',
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockPrismaService.user.create.mockResolvedValue(mockCreatedUser);
      mockJwtService.signAsync
        .mockResolvedValueOnce('access_token_mock')
        .mockResolvedValueOnce('refresh_token_mock');

      // Act
      await service.register(dtoWithoutRole as RegisterDto);

      // Assert
      expect(mockPrismaService.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: UserRole.MEMBER,
          }),
        }),
      );
    });

    it('deve fazer hash da senha antes de salvar', async () => {
      // Arrange
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockPrismaService.user.create.mockResolvedValue(mockCreatedUser);
      mockJwtService.signAsync
        .mockResolvedValueOnce('access_token_mock')
        .mockResolvedValueOnce('refresh_token_mock');

      // Act
      await service.register(registerDto);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith('senha123', 10);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            password: hashedPassword,
          }),
        }),
      );
    });

    it('deve gerar tokens JWT automaticamente após registro', async () => {
      // Arrange
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockPrismaService.user.create.mockResolvedValue(mockCreatedUser);
      mockJwtService.signAsync
        .mockResolvedValueOnce('access_token_mock')
        .mockResolvedValueOnce('refresh_token_mock');

      // Act
      const result = await service.register(registerDto);

      // Assert
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.expiresIn).toBe(3600); // 1 hora em segundos
      expect(mockJwtService.signAsync).toHaveBeenCalledTimes(2); // access + refresh
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'joao@example.com',
      password: 'senha123',
    };

    const mockUser = {
      id: 1,
      name: 'João Silva',
      email: 'joao@example.com',
      password: 'hashed_senha123',
      role: UserRole.MEMBER,
    };

    it('deve fazer login com sucesso quando credenciais válidas', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.signAsync
        .mockResolvedValueOnce('access_token_mock')
        .mockResolvedValueOnce('refresh_token_mock');

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(result.user).toEqual({
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        role: mockUser.role,
      });
      expect(result.accessToken).toBe('access_token_mock');
      expect(result.refreshToken).toBe('refresh_token_mock');
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
    });

    it('deve lançar UnauthorizedException quando email não existe', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Credenciais inválidas',
      );
    });

    it('deve lançar UnauthorizedException quando senha incorreta', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Credenciais inválidas',
      );
    });

    it('deve comparar senha com bcrypt.compare()', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.signAsync
        .mockResolvedValueOnce('access_token_mock')
        .mockResolvedValueOnce('refresh_token_mock');

      // Act
      await service.login(loginDto);

      // Assert
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'senha123',
        'hashed_senha123',
      );
    });
  });

  describe('validateUser', () => {
    const mockUser = {
      id: 1,
      name: 'João Silva',
      email: 'joao@example.com',
      role: UserRole.MEMBER,
      createdAt: new Date(),
    };

    it('deve retornar usuário quando existe', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      // Act
      const result = await service.validateUser(1);

      // Assert
      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });
    });

    it('deve lançar UnauthorizedException quando usuário não existe', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.validateUser(999)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.validateUser(999)).rejects.toThrow(
        'Usuário não encontrado',
      );
    });

    it('não deve incluir senha no retorno', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      // Act
      const result = await service.validateUser(1);

      // Assert
      expect(result).not.toHaveProperty('password');
    });
  });

  describe('refreshAccessToken', () => {
    const refreshToken = 'valid_refresh_token';
    const mockPayload = {
      sub: 1,
      email: 'joao@example.com',
      role: UserRole.MEMBER,
    };

    const mockUser = {
      id: 1,
      name: 'João Silva',
      email: 'joao@example.com',
      role: UserRole.MEMBER,
      createdAt: new Date(),
    };

    it('deve renovar access token com refresh token válido', async () => {
      // Arrange
      mockJwtService.verifyAsync.mockResolvedValue(mockPayload);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockJwtService.signAsync
        .mockResolvedValueOnce('new_access_token')
        .mockResolvedValueOnce('new_refresh_token');

      // Act
      const result = await service.refreshAccessToken(refreshToken);

      // Assert
      expect(result.accessToken).toBe('new_access_token');
      expect(result.refreshToken).toBe('new_refresh_token');
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(refreshToken);
    });

    it('deve lançar UnauthorizedException quando refresh token inválido', async () => {
      // Arrange
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Token inválido'));

      // Act & Assert
      await expect(service.refreshAccessToken('invalid_token')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.refreshAccessToken('invalid_token')).rejects.toThrow(
        'Refresh token inválido ou expirado',
      );
    });

    it('deve lançar UnauthorizedException quando usuário não existe mais', async () => {
      // Arrange
      mockJwtService.verifyAsync.mockResolvedValue(mockPayload);
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.refreshAccessToken(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('deve validar usuário antes de gerar novos tokens', async () => {
      // Arrange
      mockJwtService.verifyAsync.mockResolvedValue(mockPayload);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockJwtService.signAsync
        .mockResolvedValueOnce('new_access_token')
        .mockResolvedValueOnce('new_refresh_token');

      // Act
      await service.refreshAccessToken(refreshToken);

      // Assert
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockPayload.sub },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });
    });
  });

  describe('JWT Token Generation', () => {
    it('deve gerar access token com payload correto', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        name: 'João Silva',
        email: 'joao@example.com',
        password: 'senha123',
        role: UserRole.MEMBER,
      };

      const mockCreatedUser = {
        id: 1,
        name: registerDto.name,
        email: registerDto.email,
        role: UserRole.MEMBER,
        createdAt: new Date(),
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      mockPrismaService.user.create.mockResolvedValue(mockCreatedUser);
      mockJwtService.signAsync
        .mockResolvedValueOnce('access_token_mock')
        .mockResolvedValueOnce('refresh_token_mock');

      // Act
      await service.register(registerDto);

      // Assert
      expect(mockJwtService.signAsync).toHaveBeenNthCalledWith(
        1,
        {
          sub: mockCreatedUser.id,
          email: mockCreatedUser.email,
          role: mockCreatedUser.role,
        },
        { expiresIn: '1h' },
      );
    });

    it('deve gerar refresh token com expiração de 7 dias', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        name: 'João Silva',
        email: 'joao@example.com',
        password: 'senha123',
        role: UserRole.MEMBER,
      };

      const mockCreatedUser = {
        id: 1,
        name: registerDto.name,
        email: registerDto.email,
        role: UserRole.MEMBER,
        createdAt: new Date(),
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      mockPrismaService.user.create.mockResolvedValue(mockCreatedUser);
      mockJwtService.signAsync
        .mockResolvedValueOnce('access_token_mock')
        .mockResolvedValueOnce('refresh_token_mock');

      // Act
      await service.register(registerDto);

      // Assert
      expect(mockJwtService.signAsync).toHaveBeenNthCalledWith(
        2,
        {
          sub: mockCreatedUser.id,
          email: mockCreatedUser.email,
          role: mockCreatedUser.role,
        },
        { expiresIn: '7d' },
      );
    });
  });
});
