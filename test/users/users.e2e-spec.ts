/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { UserRole } from '../../src/auth/models/user.model';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  let userToken: string;
  let adminToken: string;
  let userId: string;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let adminId: string;
  let anotherUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = app.get<PrismaService>(PrismaService);
    jwtService = app.get<JwtService>(JwtService);

    await app.init();

    // Clean up the database
    await prismaService.business.deleteMany();
    await prismaService.user.deleteMany();

    // Create test user
    const hashedPassword = await bcrypt.hash('password123', 10);

    const user = await prismaService.user.create({
      data: {
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        phone: '1234567890',
        reserveServiceDescription: 'Reserve service description',
        role: UserRole.USER,
      },
    });
    userId = user.id;
    userToken = jwtService.sign({ sub: user.id, username: user.username });

    // Create admin user
    const admin = await prismaService.user.create({
      data: {
        username: 'adminuser',
        email: 'admin@example.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        phone: '0987654321',
        reserveServiceDescription: 'Admin reserve service description',
        role: UserRole.ADMIN,
      },
    });
    adminId = admin.id;
    adminToken = jwtService.sign({ sub: admin.id, username: admin.username });

    // Create another regular user for forbidden tests
    const anotherUser = await prismaService.user.create({
      data: {
        username: 'anotheruser',
        email: 'another@example.com',
        password: hashedPassword,
        firstName: 'Another',
        lastName: 'User',
        phone: '5555555555',
        reserveServiceDescription: 'Another reserve service description',
        role: UserRole.USER,
      },
    });
    anotherUserId = anotherUser.id;
  });

  afterAll(async () => {
    // Clean up the database - delete businesses first due to foreign key constraints
    await prismaService.business.deleteMany();
    await prismaService.user.deleteMany();
    await app.close();
  });

  describe('Get User Profile', () => {
    it('should get current user profile', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          query: `
            query {
              userProfile {
                id
                username
                email
                firstName
                lastName
                phone
                reserveServiceDescription
                role
              }
            }
          `,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.userProfile).toBeDefined();
      expect(response.body.data.userProfile.id).toBe(userId);
      expect(response.body.data.userProfile.username).toBe('testuser');
    });

    it('should fail when not authenticated', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              userProfile {
                id
                username
              }
            }
          `,
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Unauthorized');
    });
  });

  describe('Get All Users (Admin)', () => {
    it('should get all users when admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          query: `
            query {
              users {
                id
                username
                email
                firstName
                lastName
                role
              }
            }
          `,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.users).toBeDefined();
      expect(response.body.data.users).toBeInstanceOf(Array);
      expect(response.body.data.users.length).toBe(3); // Our 3 test users
    });

    it('should fail when not admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          query: `
            query {
              users {
                id
                username
              }
            }
          `,
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Forbidden');
    });
  });

  describe('Update User Profile', () => {
    it('should update own user profile', async () => {
      const updateData = {
        id: userId,
        firstName: 'Updated',
        lastName: 'Name',
        reserveServiceDescription: 'Updated reserve service description',
      };

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          query: `
            mutation UpdateUser($input: UpdateUserInput!) {
              updateUser(input: $input) {
                id
                firstName
                lastName
                reserveServiceDescription
                email
              }
            }
          `,
          variables: {
            input: updateData,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.data.updateUser).toBeDefined();
      expect(response.body.data.updateUser.firstName).toBe(
        updateData.firstName,
      );
      expect(response.body.data.updateUser.lastName).toBe(updateData.lastName);
      expect(response.body.data.updateUser.reserveServiceDescription).toBe(
        updateData.reserveServiceDescription,
      );
    });

    it('should allow admin to update any user profile', async () => {
      const updateData = {
        id: userId, // Updating the regular user
        firstName: 'Admin',
        lastName: 'Updated',
        reserveServiceDescription: 'Admin updated description',
      };

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          query: `
            mutation UpdateUser($input: UpdateUserInput!) {
              updateUser(input: $input) {
                id
                firstName
                lastName
                reserveServiceDescription
              }
            }
          `,
          variables: {
            input: updateData,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.data.updateUser).toBeDefined();
      expect(response.body.data.updateUser.firstName).toBe(
        updateData.firstName,
      );
      expect(response.body.data.updateUser.lastName).toBe(updateData.lastName);
      expect(response.body.data.updateUser.reserveServiceDescription).toBe(
        updateData.reserveServiceDescription,
      );
    });

    it('should not allow updating other user profiles when not admin', async () => {
      // Create a token for another user trying to update the first user
      const anotherUserToken = jwtService.sign({
        sub: anotherUserId,
        username: 'anotheruser',
      });

      const updateData = {
        id: userId, // Trying to update the first user
        firstName: 'Hacked',
        lastName: 'Name',
      };

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${anotherUserToken}`)
        .send({
          query: `
            mutation UpdateUser($input: UpdateUserInput!) {
              updateUser(input: $input) {
                id
                firstName
                lastName
              }
            }
          `,
          variables: {
            input: updateData,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('permission');
    });
  });

  describe('Delete User', () => {
    // Create a user to delete in these tests
    let userToDeleteId: string;
    let userToDeleteToken: string;

    beforeAll(async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const userToDelete = await prismaService.user.create({
        data: {
          username: 'deleteuser',
          email: 'delete@example.com',
          password: hashedPassword,
          firstName: 'Delete',
          lastName: 'User',
          phone: '1231231234',
          reserveServiceDescription: 'User to delete',
          role: UserRole.USER,
        },
      });
      userToDeleteId = userToDelete.id;
      userToDeleteToken = jwtService.sign({
        sub: userToDelete.id,
        username: userToDelete.username,
      });

      // Create a business for this user so we can verify cascade delete
      await prismaService.business.create({
        data: {
          name: 'Business to Delete',
          description: 'This business should be deleted with the user',
          contactInfo: { phone: '123-456-7890', email: 'business@example.com' },
          links: { website: 'https://example.com' },
          photos: ['photo1.jpg'],
          owner: {
            connect: { id: userToDeleteId },
          },
        },
      });
    });

    it('should allow a user to delete their own account', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${userToDeleteToken}`)
        .send({
          query: `
            mutation {
              deleteMyAccount
            }
          `,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.deleteMyAccount).toBe(true);

      // Verify the user was deleted
      const user = await prismaService.user.findUnique({
        where: { id: userToDeleteId },
      });
      expect(user).toBeNull();

      // Verify businesses were deleted
      const businesses = await prismaService.business.findMany({
        where: { ownerId: userToDeleteId },
      });
      expect(businesses).toHaveLength(0);
    });

    it('should allow an admin to delete any user', async () => {
      // Create a new user to delete
      const hashedPassword = await bcrypt.hash('password123', 10);
      const userToDelete = await prismaService.user.create({
        data: {
          username: 'admindelete',
          email: 'admindelete@example.com',
          password: hashedPassword,
          firstName: 'Admin',
          lastName: 'Delete',
          phone: '9879879876',
          reserveServiceDescription: 'User for admin to delete',
          role: UserRole.USER,
        },
      });

      // Create a business for this user so we can verify cascade delete
      await prismaService.business.create({
        data: {
          name: 'Admin Delete Business',
          description: 'This business should be deleted by admin',
          contactInfo: {
            phone: '123-456-7890',
            email: 'adminbusiness@example.com',
          },
          links: { website: 'https://example.com' },
          photos: ['photo1.jpg'],
          owner: {
            connect: { id: userToDelete.id },
          },
        },
      });

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          query: `
            mutation DeleteUser($id: ID!) {
              deleteUser(id: $id)
            }
          `,
          variables: {
            id: userToDelete.id,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.data.deleteUser).toBe(true);

      // Verify the user was deleted
      const user = await prismaService.user.findUnique({
        where: { id: userToDelete.id },
      });
      expect(user).toBeNull();

      // Verify businesses were deleted
      const businesses = await prismaService.business.findMany({
        where: { ownerId: userToDelete.id },
      });
      expect(businesses).toHaveLength(0);
    });

    it('should not allow a regular user to delete another user', async () => {
      // Create a user to attempt to delete
      const hashedPassword = await bcrypt.hash('password123', 10);
      const targetUser = await prismaService.user.create({
        data: {
          username: 'target',
          email: 'target@example.com',
          password: hashedPassword,
          firstName: 'Target',
          lastName: 'User',
          phone: '5555555555',
          reserveServiceDescription: 'Target user',
          role: UserRole.USER,
        },
      });

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${userToken}`) // Using the regular user token
        .send({
          query: `
            mutation DeleteUser($id: ID!) {
              deleteUser(id: $id)
            }
          `,
          variables: {
            id: targetUser.id,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('permission');

      // Verify the user was NOT deleted
      const user = await prismaService.user.findUnique({
        where: { id: targetUser.id },
      });
      expect(user).not.toBeNull();
    });
  });
});
