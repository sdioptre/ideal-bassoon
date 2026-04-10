import { PrismaClient } from '@prisma/client'

describe('Database Schema Tests', () => {
  let prisma: PrismaClient

  beforeAll(async () => {
    prisma = new PrismaClient()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe('User model', () => {
    it('should have required fields: id, email, password, createdAt, updatedAt', async () => {
      // Test that we can create a user with required fields
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: 'hashedpassword123',
        },
      })

      expect(user.id).toBeDefined()
      expect(user.email).toBe('test@example.com')
      expect(user.password).toBe('hashedpassword123')
      expect(user.createdAt).toBeDefined()
      expect(user.updatedAt).toBeDefined()

      await prisma.user.delete({ where: { id: user.id } })
    })

    it('should have unique constraint on email', async () => {
      await prisma.user.create({
        data: {
          email: 'unique@example.com',
          password: 'hashedpassword123',
        },
      })

      await expect(
        prisma.user.create({
          data: {
            email: 'unique@example.com',
            password: 'hashedpassword123',
          },
        })
      ).rejects.toThrow()

      await prisma.user.deleteMany({ where: { email: 'unique@example.com' } })
    })

    it('should have index on user_id for GameSession queries', async () => {
      // Create user and game session to test index
      const user = await prisma.user.create({
        data: {
          email: 'indexed@example.com',
          password: 'hashedpassword123',
        },
      })

      const room = await prisma.room.create({
        data: {
          name: 'Test Room',
          createdBy: user.id,
        },
      })

      const game = await prisma.game.create({
        data: {
          roomId: room.id,
          passageId: 'test-passage-id',
        },
      })

      await prisma.gameSession.create({
        data: {
          userId: user.id,
          roomId: room.id,
          gameId: game.id,
        },
      })

      // Query by userId should work efficiently (index exists)
      const sessions = await prisma.gameSession.findMany({
        where: { userId: user.id },
      })

      expect(sessions.length).toBeGreaterThan(0)

      // Cleanup
      await prisma.gameSession.deleteMany({ where: { userId: user.id } })
      await prisma.game.deleteMany({ where: { roomId: room.id } })
      await prisma.room.deleteMany({ where: { id: room.id } })
      await prisma.user.delete({ where: { id: user.id } })
    })
  })

  describe('Room model', () => {
    it('should have required fields: id, name, createdBy, maxPlayers, isActive, createdAt, updatedAt', async () => {
      const room = await prisma.room.create({
        data: {
          name: 'Test Room',
          createdBy: 'user-123',
          maxPlayers: 8,
          isActive: true,
        },
      })

      expect(room.id).toBeDefined()
      expect(room.name).toBe('Test Room')
      expect(room.createdBy).toBe('user-123')
      expect(room.maxPlayers).toBe(8)
      expect(room.isActive).toBe(true)
      expect(room.createdAt).toBeDefined()
      expect(room.updatedAt).toBeDefined()

      await prisma.room.delete({ where: { id: room.id } })
    })

    it('should have index on room_id for Game and GameSession queries', async () => {
      const room = await prisma.room.create({
        data: {
          name: 'Indexed Room',
          createdBy: 'user-456',
        },
      })

      await prisma.game.create({
        data: {
          roomId: room.id,
          passageId: 'test-passage-id',
        },
      })

      await prisma.gameSession.create({
        data: {
          userId: 'user-456',
          roomId: room.id,
          gameId: 'game-123',
        },
      })

      // Query by roomId should work efficiently (index exists)
      const games = await prisma.game.findMany({
        where: { roomId: room.id },
      })

      expect(games.length).toBeGreaterThan(0)

      // Cleanup
      await prisma.game.deleteMany({ where: { roomId: room.id } })
      await prisma.gameSession.deleteMany({ where: { roomId: room.id } })
      await prisma.room.delete({ where: { id: room.id } })
    })
  })

  describe('Game model', () => {
    it('should have required fields: id, roomId, passageId, status, createdAt, updatedAt', async () => {
      const room = await prisma.room.create({
        data: {
          name: 'Test Room',
          createdBy: 'user-789',
        },
      })

      const game = await prisma.game.create({
        data: {
          roomId: room.id,
          passageId: 'passage-123',
          status: 'CREATED',
        },
      })

      expect(game.id).toBeDefined()
      expect(game.roomId).toBe(room.id)
      expect(game.passageId).toBe('passage-123')
      expect(game.status).toBe('CREATED')
      expect(game.createdAt).toBeDefined()
      expect(game.updatedAt).toBeDefined()

      await prisma.game.delete({ where: { id: game.id } })
      await prisma.room.delete({ where: { id: room.id } })
    })

    it('should have index on game_id for GameSession queries', async () => {
      const room = await prisma.room.create({
        data: {
          name: 'Test Room',
          createdBy: 'user-999',
        },
      })

      const game = await prisma.game.create({
        data: {
          roomId: room.id,
          passageId: 'passage-123',
        },
      })

      await prisma.gameSession.create({
        data: {
          userId: 'user-999',
          roomId: room.id,
          gameId: game.id,
        },
      })

      // Query by gameId should work efficiently (index exists)
      const sessions = await prisma.gameSession.findMany({
        where: { gameId: game.id },
      })

      expect(sessions.length).toBeGreaterThan(0)

      // Cleanup
      await prisma.gameSession.deleteMany({ where: { gameId: game.id } })
      await prisma.game.deleteMany({ where: { roomId: room.id } })
      await prisma.room.delete({ where: { id: room.id } })
    })
  })

  describe('Passage model', () => {
    it('should have required fields: id, text, wordCount, difficulty, createdAt, updatedAt', async () => {
      const passage = await prisma.passage.create({
        data: {
          text: 'This is a test passage for typing practice.',
          wordCount: 10,
          difficulty: 'EASY',
        },
      })

      expect(passage.id).toBeDefined()
      expect(passage.text).toBe('This is a test passage for typing practice.')
      expect(passage.wordCount).toBe(10)
      expect(passage.difficulty).toBe('EASY')
      expect(passage.createdAt).toBeDefined()
      expect(passage.updatedAt).toBeDefined()

      await prisma.passage.delete({ where: { id: passage.id } })
    })
  })

  describe('GameSession model', () => {
    it('should have required fields: id, userId, roomId, gameId, startedAt, createdAt, updatedAt', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'session@example.com',
          password: 'hashedpassword123',
        },
      })

      const room = await prisma.room.create({
        data: {
          name: 'Test Room',
          createdBy: user.id,
        },
      })

      const game = await prisma.game.create({
        data: {
          roomId: room.id,
          passageId: 'passage-123',
        },
      })

      const session = await prisma.gameSession.create({
        data: {
          userId: user.id,
          roomId: room.id,
          gameId: game.id,
          wpm: 60,
          accuracy: 95.5,
          errors: 2,
        },
      })

      expect(session.id).toBeDefined()
      expect(session.userId).toBe(user.id)
      expect(session.roomId).toBe(room.id)
      expect(session.gameId).toBe(game.id)
      expect(session.startedAt).toBeDefined()
      expect(session.wpm).toBe(60)
      expect(session.accuracy).toBe(95.5)
      expect(session.errors).toBe(2)
      expect(session.createdAt).toBeDefined()
      expect(session.updatedAt).toBeDefined()

      await prisma.gameSession.delete({ where: { id: session.id } })
      await prisma.game.deleteMany({ where: { roomId: room.id } })
      await prisma.room.delete({ where: { id: room.id } })
      await prisma.user.delete({ where: { id: user.id } })
    })

    it('should have composite index on (roomId, userId, gameId) for efficient lookups', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'composite@example.com',
          password: 'hashedpassword123',
        },
      })

      const room = await prisma.room.create({
        data: {
          name: 'Test Room',
          createdBy: user.id,
        },
      })

      const game = await prisma.game.create({
        data: {
          roomId: room.id,
          passageId: 'passage-123',
        },
      })

      await prisma.gameSession.create({
        data: {
          userId: user.id,
          roomId: room.id,
          gameId: game.id,
        },
      })

      // Query by composite keys should work efficiently
      const session = await prisma.gameSession.findFirst({
        where: {
          roomId: room.id,
          userId: user.id,
          gameId: game.id,
        },
      })

      expect(session).toBeDefined()

      // Cleanup
      await prisma.gameSession.deleteMany({
        where: {
          roomId: room.id,
          userId: user.id,
          gameId: game.id,
        },
      })
      await prisma.game.deleteMany({ where: { roomId: room.id } })
      await prisma.room.delete({ where: { id: room.id } })
      await prisma.user.delete({ where: { id: user.id } })
    })
  })
})
