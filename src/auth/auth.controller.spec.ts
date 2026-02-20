/**
 * Testes Unitários - AuthController
 *
 * Cobertura:
 * - POST /auth/register - Registrar novo usuário
 * - POST /auth/login - Autenticar usuário
 * - POST /auth/refresh - Renovar access token
 * - GET /auth/me - Obter perfil do usuário autenticado
 */

import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    refreshAccessToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  describe('register()', () => {
    it('deve registrar novo usuário', async () => {
      const registerDto = {
        name: 'João Silva',
        email: 'joao@example.com',
        password: 'senha123',
      };

      const mockResponse = {
        user: {
          id: 1,
          name: 'João Silva',
          email: 'joao@example.com',
          role: 'MEMBER',
        },
        accessToken: 'token123',
        refreshToken: 'refresh123',
      };

      mockAuthService.register.mockResolvedValue(mockResponse);

      const result = await controller.register(registerDto);

      expect(result).toEqual(mockResponse);
      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
      expect(mockAuthService.register).toHaveBeenCalledTimes(1);
    });
  });

  describe('login()', () => {
    it('deve autenticar usuário', async () => {
      const loginDto = {
        email: 'joao@example.com',
        password: 'senha123',
      };

      const mockResponse = {
        user: {
          id: 1,
          name: 'João Silva',
          email: 'joao@example.com',
          role: 'MEMBER',
        },
        accessToken: 'token123',
        refreshToken: 'refresh123',
      };

      mockAuthService.login.mockResolvedValue(mockResponse);

      const result = await controller.login(loginDto);

      expect(result).toEqual(mockResponse);
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
      expect(mockAuthService.login).toHaveBeenCalledTimes(1);
    });
  });

  describe('refresh()', () => {
    it('deve renovar access token', async () => {
      const refreshToken = 'refresh123';

      const mockResponse = {
        accessToken: 'newToken456',
        refreshToken: 'newRefresh456',
      };

      mockAuthService.refreshAccessToken.mockResolvedValue(mockResponse);

      const result = await controller.refresh(refreshToken);

      expect(result).toEqual(mockResponse);
      expect(mockAuthService.refreshAccessToken).toHaveBeenCalledWith(
        refreshToken,
      );
      expect(mockAuthService.refreshAccessToken).toHaveBeenCalledTimes(1);
    });
  });

  describe('getProfile()', () => {
    it('deve retornar perfil do usuário autenticado', async () => {
      const user = {
        id: 1,
        email: 'joao@example.com',
        name: 'João Silva',
        role: 'MEMBER',
      };

      const result = await controller.getProfile(user);

      expect(result).toEqual({
        message: 'Perfil do usuário autenticado',
        user,
      });
    });
  });
});
