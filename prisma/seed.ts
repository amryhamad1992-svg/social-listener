import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create Revlon brand
  const revlon = await prisma.brand.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Revlon',
      keywords: [
        'revlon',
        'super lustrous',
        'colorstay',
        'revlon lipstick',
        'revlon foundation',
        'revlon makeup',
      ],
      subreddits: [
        'MakeupAddiction',
        'drugstoreMUA',
        'Sephora',
        'BeautyGuruChatter',
        'SkincareAddiction',
      ],
      isActive: true,
    },
  });

  console.log('Created brand:', revlon.name);

  // Create demo user
  const passwordHash = await bcrypt.hash('demo123', 12);

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@stackline.com' },
    update: {},
    create: {
      email: 'demo@stackline.com',
      passwordHash,
      name: 'Demo User',
      selectedBrandId: revlon.id,
    },
  });

  console.log('Created demo user:', demoUser.email);
  console.log('Password: demo123');

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
