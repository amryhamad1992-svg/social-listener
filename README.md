# Social Listener - Beauty Brand Monitoring

A social listening dashboard for monitoring beauty brand mentions across YouTube, News, and Reddit. Built for tracking brands like Revlon, e.l.f., and Maybelline.

**Live Demo:** https://social-listener-production.up.railway.app

---

## Features

### Dashboard
- **KPI Cards** - Total mentions, sentiment score, trending topics
- **Sentiment Trend Chart** - 7/14/30/90 day sentiment analysis
- **Google Search Trends** - Brand interest over time with top searches
- **Brand Keyword Analysis** - Compare brands on generic terms (affordable, drugstore, viral, TikTok, etc.)

### Mentions Page
- **Multi-source aggregation** - YouTube, News, Reddit
- **Brand filtering** - Filter by Revlon, e.l.f., Maybelline
- **Source filtering** - Toggle individual sources on/off
- **Sentiment badges** - AI-powered sentiment analysis (Positive/Neutral/Negative)
- **Engagement indicators** - Views, likes, comments, "Hot" badges for viral content

### Trending Page
- **Trending topics table** - Sortable by mentions, sentiment, change %
- **Date range filters** - 7, 14, 30, 90 days
- **Brand-specific trends** - Filter by individual brand or all brands

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | Next.js 16, TypeScript, Tailwind CSS |
| **Charts** | Recharts |
| **Backend** | Next.js API Routes |
| **Database** | PostgreSQL (Prisma ORM) |
| **Deployment** | Railway |

---

## Data Sources

### Working (Real Data)

| Source | Method | Status |
|--------|--------|--------|
| **YouTube** | YouTube Data API v3 | Real videos with views, likes, working URLs |
| **News** | NewsAPI | Real articles from news sources |
| **Sentiment** | OpenAI GPT-4o-mini | AI-powered sentiment analysis |

### In Development

| Source | Method | Status |
|--------|--------|--------|
| **Reddit** | Cheerio web scraping (old.reddit.com) | Enabled but needs debugging |
| **MakeupAlley** | Web scraping | Disabled (DNS issues) |
| **Temptalia** | Web scraping | Disabled (needs HTML updates) |
| **Allure** | Web scraping | Disabled (needs HTML updates) |
| **Into The Gloss** | Web scraping | Disabled (needs HTML updates) |

---

## Environment Variables

Create a `.env.local` file (never commit this):

```env
# Required for real data
YOUTUBE_API_KEY=your_youtube_api_key
NEWS_API_KEY=your_newsapi_key
OPENAI_API_KEY=your_openai_key

# Optional
DATABASE_URL=your_postgresql_url
JWT_SECRET=your_jwt_secret
```

### Getting API Keys

| API | Where to get it |
|-----|-----------------|
| YouTube | [Google Cloud Console](https://console.cloud.google.com/) - APIs & Services - YouTube Data API v3 |
| NewsAPI | [newsapi.org](https://newsapi.org/) - Free tier available |
| OpenAI | [platform.openai.com](https://platform.openai.com/) - API Keys |

---

## Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

---

## Project Structure

```
src/
├── app/
│   ├── dashboard/       # Main dashboard page
│   ├── mentions/        # Brand mentions feed
│   ├── trending/        # Trending topics table
│   ├── api/
│   │   ├── youtube/     # YouTube API integration
│   │   ├── news/        # NewsAPI integration
│   │   └── scrape/      # Web scraper orchestration
│   └── login/           # Authentication
├── components/
│   ├── Sidebar.tsx      # Navigation sidebar
│   ├── DataTable.tsx    # Reusable data table
│   ├── SearchTrends.tsx # Google trends chart
│   └── BrandKeywordExplorer.tsx  # Keyword comparison
└── lib/
    ├── scrapers/        # Web scrapers (Reddit, blogs)
    ├── youtube.ts       # YouTube API client
    ├── newsApi.ts       # NewsAPI client
    └── sentiment.ts     # OpenAI sentiment analysis
```

---

## Brand Keyword Analysis

The keyword analysis compares brands on **generic beauty terms** that apply to all brands:

| Keyword | What it measures |
|---------|------------------|
| affordable | Price perception |
| drugstore | Channel association |
| long-lasting | Product performance |
| full coverage | Product attributes |
| lipstick | Category strength |
| foundation | Category strength |
| mascara | Category strength |
| dupe | Value/alternative perception |
| viral | Social media buzz |
| TikTok | Platform presence |

This allows meaningful cross-brand comparison (e.g., "e.l.f. dominates TikTok mentions while Revlon leads in lipstick").

---

## Deployment

### Railway

1. Connect GitHub repository to Railway
2. Set environment variables in Railway dashboard:
   - `YOUTUBE_API_KEY`
   - `NEWS_API_KEY`
   - `OPENAI_API_KEY`
3. Railway auto-deploys on push to main

---

## Security

- API keys are stored in environment variables (not in code)
- `.env*` files are gitignored
- No secrets are committed to the repository

---

## Roadmap

- [ ] Fix Reddit scraper (old.reddit.com HTML parsing)
- [ ] Add more beauty blog scrapers
- [ ] Real-time notifications for trending topics
- [ ] Export data to CSV
- [ ] Email digest reports
- [ ] Multi-category support (beyond Beauty)

---

## License

Private project for Stackline.
