import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { UserRole } from '../../src/auth/dto/user-role.enum';
import { AuthTestModule } from './auth-test.module';

interface AuthResponse {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  access_token: string;
}

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  
  const testUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
  };
  
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuthTestModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    
    await app.init();
    
    prismaService = app.get<PrismaService>(PrismaService);
    
    // Clean the database before tests
    try {
      await prismaService.user.deleteMany({
        where: {
          OR: [
            { username: testUser.username },
            { email: testUser.email },
          ],
        },
      });
    } catch (error) {
      console.error('Database cleanup error:', error);
    }
  });

  afterAll(async () => {
    try {
      // Clean up after tests
      await prismaService.user.deleteMany({
        where: {
          OR: [
            { username: testUser.username },
            { email: testUser.email },
          ],
        },
      });
    } catch (error) {
      console.error('Database cleanup error:', error);
    }
    
    await app?.close();
  });

  describe('Authentication', () => {
    it('/auth/register (POST) - should register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201);
      
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('username', testUser.username);
      expect(response.body).toHaveProperty('email', testUser.email);
      expect(response.body).toHaveProperty('role', UserRole.USER);
      expect(response.body).toHaveProperty('access_token');
      
      // Save the user ID and token for later tests
      const authResponse = response.body as AuthResponse;
      userId = authResponse.id;
      authToken = authResponse.access_token;
    });
    
    it('/auth/register (POST) - should not allow duplicate registration', async () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(409); // Conflict
    });
    
    it('/auth/login (POST) - should authenticate a user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password,
        })
        .expect(201);
      
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('username', testUser.username);
      expect(response.body).toHaveProperty('email', testUser.email);
      expect(response.body).toHaveProperty('access_token');
      
      // Update the auth token with the latest
      const authResponse = response.body as AuthResponse;
      authToken = authResponse.access_token;
    });
    
    it('/auth/login (POST) - should fail with invalid credentials', async () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: testUser.username,
          password: 'wrongpassword',
        })
        .expect(401); // Unauthorized
    });
  });
  
  describe('Authorization', () => {
    it('/auth/profile (GET) - should get user profile with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('id', userId);
      expect(response.body).toHaveProperty('username', testUser.username);
      expect(response.body).toHaveProperty('email', testUser.email);
      expect(response.body).toHaveProperty('role', UserRole.USER);
    });
    
    it('/auth/profile (GET) - should fail without token', async () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401); // Unauthorized
    });
    
    it('/auth/admin (GET) - should deny access to regular users', async () => {
      return request(app.getHttpServer())
        .get('/auth/admin')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403); // Forbidden
    });
  });
}); 
