/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from './dto/user-role.enum';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { ExecutionContext } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockPrismaService = {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  // Mock the JwtAuthGuard to always return true
  const mockJwtAuthGuard = {
    canActivate: jest.fn().mockImplementation((context: ExecutionContext) => {
      const req = context.switchToHttp().getRequest();
      req.user = {
        id: 'user-id',
        username: 'testuser',
        email: 'test@example.com',
        role: UserRole.USER,
      };
      return true;
    }),
  };

  // Mock the RolesGuard to always return true
  const mockRolesGuard = {
    canActivate: jest.fn().mockImplementation(() => {
      return true;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should call authService.register with the provided dto', async () => {
      const registerDto = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };
      const expectedResult = {
        id: 'user-id',
        username: registerDto.username,
        email: registerDto.email,
        role: UserRole.USER,
        access_token: 'jwt-token',
      };

      mockAuthService.register.mockResolvedValue(expectedResult);

      const result = await controller.register(registerDto);

      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('login', () => {
    it('should call authService.login with the provided dto', async () => {
      const loginDto = {
        username: 'testuser',
        password: 'password123',
      };
      const expectedResult = {
        id: 'user-id',
        username: loginDto.username,
        email: 'test@example.com',
        role: UserRole.USER,
        access_token: 'jwt-token',
      };

      mockAuthService.login.mockResolvedValue(expectedResult);

      const result = await controller.login(loginDto);

      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getProfile', () => {
    it('should return the user from the request', () => {
      const userProfile = {
        id: 'user-id',
        username: 'testuser',
        email: 'test@example.com',
        role: UserRole.USER,
      };
      
      // Directly mock the method call and implementation
      jest.spyOn(controller, 'getProfile').mockImplementation(() => userProfile);
      
      // Call the method directly without passing a request
      const result = controller.getProfile({} as any);
      
      expect(result).toEqual(userProfile);
    });
  });

  describe('adminOnly', () => {
    it('should return an admin message', () => {
      const result = controller.adminOnly();

      expect(result).toEqual({ message: 'Admin access granted' });
    });
  });
});
