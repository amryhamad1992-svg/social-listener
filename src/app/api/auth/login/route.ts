import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword, generateToken, setAuthCookie } from '@/lib/auth';

// Demo credentials for when database is unavailable
const DEMO_USERS = [
  { email: 'demo@sociallistener.com', password: 'Demo2024!', name: 'Demo User' },
  { email: 'admin@sociallistener.com', password: 'Admin2024!', name: 'Admin' },
];

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check demo credentials first (works without database)
    const demoUser = DEMO_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (demoUser) {
      const token = generateToken({ userId: 1, email: demoUser.email });
      await setAuthCookie(token);

      return NextResponse.json({
        success: true,
        data: {
          user: {
            id: 1,
            email: demoUser.email,
            name: demoUser.name,
            selectedBrandId: null,
            brand: null,
          },
          token,
        },
        source: 'demo',
      });
    }

    // Try database authentication
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        include: { selectedBrand: true },
      });

      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Invalid credentials' },
          { status: 401 }
        );
      }

      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: 'Invalid credentials' },
          { status: 401 }
        );
      }

      const token = generateToken({ userId: user.id, email: user.email });
      await setAuthCookie(token);

      return NextResponse.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            selectedBrandId: user.selectedBrandId,
            brand: user.selectedBrand,
          },
          token,
        },
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      // If database fails and no demo match, return invalid credentials
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
