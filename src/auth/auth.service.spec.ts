import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { UserRole } from './dto/user-role.enum';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const mockPrismaService = {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };

    it('should throw ConflictException if username or email already exists', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({ id: 'some-id' });

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { username: registerDto.username },
            { email: registerDto.email },
          ],
        },
      });
    });

    it('should create a new user and return token on successful registration', async () => {
      const hashedPassword = 'hashed-password';
      const userId = 'user-id';
      const token = 'jwt-token';

      mockPrismaService.user.findFirst.mockResolvedValue(null);
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(() => Promise.resolve(hashedPassword));
      mockPrismaService.user.create.mockResolvedValue({
        id: userId,
        username: registerDto.username,
        email: registerDto.email,
        role: UserRole.USER,
        password: hashedPassword,
      });
      mockJwtService.sign.mockReturnValue(token);

      const result = await service.register(registerDto);

      expect(mockPrismaService.user.findFirst).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          username: registerDto.username,
          email: registerDto.email,
          password: hashedPassword,
          role: UserRole.USER,
        },
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: userId,
        username: registerDto.username,
      });
      expect(result).toEqual({
        id: userId,
        username: registerDto.username,
        email: registerDto.email,
        role: UserRole.USER,
        access_token: token,
      });
    });
  });

  describe('login', () => {
    const loginDto = {
      username: 'testuser',
      password: 'password123',
    };

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { username: loginDto.username },
      });
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      const user = {
        id: 'user-id',
        username: loginDto.username,
        password: 'hashed-password',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(false));

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { username: loginDto.username },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        user.password,
      );
    });

    it('should return user and token on successful login', async () => {
      const user = {
        id: 'user-id',
        username: loginDto.username,
        email: 'test@example.com',
        role: UserRole.USER,
        password: 'hashed-password',
      };
      const token = 'jwt-token';

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true));
      mockJwtService.sign.mockReturnValue(token);

      const result = await service.login(loginDto);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { username: loginDto.username },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        user.password,
      );
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: user.id,
        username: user.username,
      });
      expect(result).toEqual({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        access_token: token,
      });
    });
  });
});
