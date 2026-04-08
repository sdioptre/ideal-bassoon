import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create sample users
  const user1 = await prisma.user.upsert({
    where: { email: 'player1@example.com' },
    update: {},
    create: {
      email: 'player1@example.com',
      password: '$2b$10$YourHashedPasswordHere', // In production, use bcrypt
    },
  })

  const user2 = await prisma.user.upsert({
    where: { email: 'player2@example.com' },
    update: {},
    create: {
      email: 'player2@example.com',
      password: '$2b$10$YourHashedPasswordHere',
    },
  })

  console.log(`Created users: ${user1.id}, ${user2.id}`)

  // Create sample passages
  const passage1 = await prisma.passage.create({
    data: {
      text: `The quick brown fox jumps over the lazy dog. This is a classic pangram that contains every letter of the alphabet. Typing practice often uses such sentences to ensure comprehensive letter coverage. Speed and accuracy are key metrics in typing races.`,
      wordCount: 43,
      difficulty: 'EASY',
    },
  })

  const passage2 = await prisma.passage.create({
    data: {
      text: `Programming is the art of telling another human what one wants the computer to do. It requires precision, patience, and a deep understanding of logic. The journey from novice to expert is filled with challenges and breakthroughs.`,
      wordCount: 41,
      difficulty: 'MEDIUM',
    },
  })

  const passage3 = await prisma.passage.create({
    data: {
      text: `In the realm of distributed systems, consistency and availability often present a trade-off that architects must carefully navigate. The CAP theorem provides a framework for understanding these fundamental limitations. Real-time synchronization adds another layer of complexity to this already challenging domain.`,
      wordCount: 52,
      difficulty: 'HARD',
    },
  })

  console.log(`Created passages: ${passage1.id}, ${passage2.id}, ${passage3.id}`)

  // Create a sample room
  const room = await prisma.room.create({
    data: {
      name: 'Test Room',
      createdBy: user1.id,
      maxPlayers: 8,
      isActive: true,
    },
  })

  console.log(`Created room: ${room.id}`)

  // Create a sample game
  const game = await prisma.game.create({
    data: {
      roomId: room.id,
      passageId: passage1.id,
      status: 'CREATED',
    },
  })

  console.log(`Created game: ${game.id}`)

  // Create sample game sessions
  const session1 = await prisma.gameSession.create({
    data: {
      userId: user1.id,
      roomId: room.id,
      gameId: game.id,
      wpm: 65,
      accuracy: 98.5,
      errors: 2,
    },
  })

  const session2 = await prisma.gameSession.create({
    data: {
      userId: user2.id,
      roomId: room.id,
      gameId: game.id,
      wpm: 72,
      accuracy: 97.2,
      errors: 3,
    },
  })

  console.log(`Created game sessions: ${session1.id}, ${session2.id}`)

  console.log('Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
