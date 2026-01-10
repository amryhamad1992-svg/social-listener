import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Setup endpoint - creates database tables
// Call once: GET /api/setup?key=setup2024

const SETUP_KEY = 'setup2024';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const key = searchParams.get('key');

  if (key !== SETUP_KEY) {
    return NextResponse.json(
      { success: false, error: 'Invalid setup key' },
      { status: 401 }
    );
  }

  try {
    // Create tables using raw SQL
    await prisma.$executeRawUnsafe(`
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        selected_brand_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Brands table
      CREATE TABLE IF NOT EXISTS brands (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        keywords TEXT[] DEFAULT '{}',
        subreddits TEXT[] DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Reddit posts table
      CREATE TABLE IF NOT EXISTS reddit_posts (
        id SERIAL PRIMARY KEY,
        reddit_id VARCHAR(255) UNIQUE NOT NULL,
        subreddit VARCHAR(255) NOT NULL,
        title TEXT NOT NULL,
        body TEXT,
        author VARCHAR(255),
        score INTEGER DEFAULT 0,
        num_comments INTEGER DEFAULT 0,
        url TEXT,
        permalink TEXT,
        created_utc TIMESTAMP NOT NULL,
        fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Brand mentions table
      CREATE TABLE IF NOT EXISTS brand_mentions (
        id SERIAL PRIMARY KEY,
        brand_id INTEGER NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
        post_id INTEGER NOT NULL REFERENCES reddit_posts(id) ON DELETE CASCADE,
        mention_type VARCHAR(50) NOT NULL,
        matched_keyword VARCHAR(255) NOT NULL,
        sentiment_score FLOAT,
        sentiment_label VARCHAR(50),
        snippet TEXT,
        analyzed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Trending terms table
      CREATE TABLE IF NOT EXISTS trending_terms (
        id SERIAL PRIMARY KEY,
        brand_id INTEGER NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
        term VARCHAR(255) NOT NULL,
        mention_count INTEGER NOT NULL,
        avg_sentiment FLOAT,
        date DATE NOT NULL,
        UNIQUE(brand_id, term, date)
      );

      -- Fetch logs table
      CREATE TABLE IF NOT EXISTS fetch_logs (
        id SERIAL PRIMARY KEY,
        subreddit VARCHAR(255) NOT NULL,
        posts_fetched INTEGER NOT NULL,
        fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        success BOOLEAN DEFAULT true,
        error_message TEXT
      );

      -- Add foreign key to users after brands exists
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'users_selected_brand_id_fkey'
        ) THEN
          ALTER TABLE users
          ADD CONSTRAINT users_selected_brand_id_fkey
          FOREIGN KEY (selected_brand_id) REFERENCES brands(id);
        END IF;
      END $$;

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_reddit_posts_subreddit ON reddit_posts(subreddit);
      CREATE INDEX IF NOT EXISTS idx_reddit_posts_created_utc ON reddit_posts(created_utc);
      CREATE INDEX IF NOT EXISTS idx_brand_mentions_brand_id ON brand_mentions(brand_id);
      CREATE INDEX IF NOT EXISTS idx_brand_mentions_created_at ON brand_mentions(created_at);
      CREATE INDEX IF NOT EXISTS idx_brand_mentions_sentiment ON brand_mentions(sentiment_label);
      CREATE INDEX IF NOT EXISTS idx_trending_terms_date ON trending_terms(date);
      CREATE INDEX IF NOT EXISTS idx_fetch_logs_fetched_at ON fetch_logs(fetched_at);
    `);

    return NextResponse.json({
      success: true,
      message: 'Database tables created successfully',
    });
  } catch (error: any) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Setup failed' },
      { status: 500 }
    );
  }
}
