import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// One-time seed endpoint - creates initial brands and demo user
// Call this once after database is set up: GET /api/seed?key=setup2024
// v2 - fixed deployment

const SEED_KEY = 'setup2024';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const key = searchParams.get('key');

  // Simple protection to prevent accidental re-seeding
  if (key !== SEED_KEY) {
    return NextResponse.json(
      { success: false, error: 'Invalid seed key' },
      { status: 401 }
    );
  }

  try {
    // Check if already seeded
    const existingBrands = await prisma.brand.count();
    if (existingBrands > 0) {
      return NextResponse.json({
        success: true,
        message: 'Database already seeded',
        brands: existingBrands,
      });
    }

    // Create brands
    const revlon = await prisma.brand.create({
      data: {
        name: 'Revlon',
        keywords: [
          'revlon',
          'super lustrous',
          'colorstay',
          'revlon lipstick',
          'revlon foundation',
          'revlon makeup',
          'revlon one step',
          'revlon hair dryer',
        ],
        subreddits: [
          'MakeupAddiction',
          'drugstoreMUA',
          'Sephora',
          'BeautyGuruChatter',
          'SkincareAddiction',
          'beauty',
          'PanPorn',
          'MakeupRehab',
        ],
        isActive: true,
      },
    });

    const elf = await prisma.brand.create({
      data: {
        name: 'e.l.f. Cosmetics',
        keywords: [
          'elf cosmetics',
          'e.l.f.',
          'elf makeup',
          'elf halo glow',
          'elf power grip',
          'elf camo concealer',
          'elf dupe',
          'elf primer',
        ],
        subreddits: [
          'MakeupAddiction',
          'drugstoreMUA',
          'BeautyGuruChatter',
          'beauty',
          'SkincareAddiction',
          'PanPorn',
          'MakeupRehab',
          'Sephora',
        ],
        isActive: true,
      },
    });

    const maybelline = await prisma.brand.create({
      data: {
        name: 'Maybelline',
        keywords: [
          'maybelline',
          'maybelline sky high',
          'maybelline fit me',
          'maybelline superstay',
          'maybelline vinyl ink',
          'maybelline mascara',
          'maybelline foundation',
          'maybelline concealer',
        ],
        subreddits: [
          'MakeupAddiction',
          'drugstoreMUA',
          'BeautyGuruChatter',
          'beauty',
          'SkincareAddiction',
          'PanPorn',
          'MakeupRehab',
          'Sephora',
        ],
        isActive: true,
      },
    });

    // Create demo user with Revlon as default brand
    const passwordHash = await bcrypt.hash('Demo2024!', 12);
    const demoUser = await prisma.user.create({
      data: {
        email: 'demo@sociallistener.com',
        passwordHash,
        name: 'Demo User',
        selectedBrandId: revlon.id,
      },
    });

    // Create admin user
    const adminHash = await bcrypt.hash('Admin2024!', 12);
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@sociallistener.com',
        passwordHash: adminHash,
        name: 'Admin',
        selectedBrandId: revlon.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      data: {
        brands: [
          { id: revlon.id, name: revlon.name },
          { id: elf.id, name: elf.name },
          { id: maybelline.id, name: maybelline.name },
        ],
        users: [
          { id: demoUser.id, email: demoUser.email },
          { id: adminUser.id, email: adminUser.email },
        ],
      },
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Seed failed' },
      { status: 500 }
    );
  }
}
