# Social Listener - Brand Monitoring Dashboard

A Stackline-style social listening and brand monitoring dashboard for beauty brands. Built for VP-level presentations and executive reporting.

**Live Demo**: https://social-listener-production.up.railway.app

## Overview

Social Listener provides real-time brand monitoring, sentiment analysis, and competitive intelligence for beauty brands (Revlon, e.l.f., Maybelline). The dashboard follows Stackline's design language with clean typography, minimal charts, and professional color schemes.

## Features

### Dashboard
- **Global Date Range**: Single date picker controls all components (7, 14, 30, 90 days)
- **Quick Stats Bar**: Live metrics with brand indicator
- **Executive Summary**: AI-powered insights that update based on selected time period
- **Spike Alerts**: Real-time alerts for mention spikes, sentiment shifts, and trending topics
- **KPI Cards with Sparklines**: Stackline-style inline charts showing current vs prior period
  - Total Mentions
  - Avg. Sentiment
  - Share of Voice
  - Engagement Rate
- **Mentions by Day Chart**: Grouped bar chart (navy for current, gray for prior period)
- **Sentiment Distribution**: Donut chart with Stackline color palette
- **Competitor Battlecard**: Head-to-head brand comparison with SWOT summary

### Trending Page
- **Trending Topics Table**: Keywords ranked by mentions with sparklines
- **Word Cloud View**: Visual topic exploration by category
- **Brand Keyword Explorer**: Cross-brand keyword comparison chart
- **Velocity Indicators**: Rising, steady, or cooling trends

### Mentions Page
- **Purchase Intent Signals**: Real-time buying signals categorized as:
  - Purchase (confirmed buys)
  - Consideration (thinking about buying)
  - Research (price/availability queries)
- **Multi-Source Filtering**: YouTube, Reddit, News, MakeupAlley, Temptalia
- **Sentiment Filtering**: Positive, Neutral, Negative
- **Sort Options**: Most Recent, Most Engaged, Highest Reach
- **Card & Compact Views**: Toggle between detailed cards and compact list

## Design System

### Stackline Color Palette
| Color | Hex | Usage |
|-------|-----|-------|
| Navy | #1E293B | Primary text, current period bars |
| Gray | #CBD5E1 | Prior period bars, secondary elements |
| Muted | #64748B | Labels, descriptions |
| Teal | #14B8A6 | Accent color, neutral sentiment |
| Gold | #FBBF24 | Warning, consideration intent |
| Sky | #0EA5E9 | Links, positive highlights |

### Typography
- **Font**: Roboto (Google Fonts)
- **Headings**: 11px uppercase, tracking-wider
- **Values**: 32px font-medium for KPIs
- **Body**: 12-13px for content

### Chart Styles
- **Sparklines**: Dual-line (navy current, gray prior), no axes
- **Bar Charts**: Grouped bars with rounded tops, 2px gap
- **Legends**: Positioned at top, horizontal layout
- **Tooltips**: White background, subtle shadow, 8px border radius

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **Database**: PostgreSQL (Prisma ORM)
- **Deployment**: Railway

## Project Structure

\`\`\`
src/
├── app/
│   ├── dashboard/page.tsx    # Main dashboard
│   ├── trending/page.tsx     # Trending topics
│   ├── mentions/page.tsx     # Brand mentions
│   ├── settings/page.tsx     # User settings
│   └── api/                   # API routes
├── components/
│   ├── KPICard.tsx           # KPI cards with sparklines
│   ├── SentimentChart.tsx    # Bar chart + pie chart
│   ├── ExecutiveSummary.tsx  # AI insights
│   ├── SpikeAlerts.tsx       # Alert notifications
│   ├── CompetitorBattlecard.tsx
│   ├── PurchaseIntentSignals.tsx
│   ├── BrandKeywordExplorer.tsx
│   ├── QuickStatsBar.tsx
│   └── Sidebar.tsx
├── lib/
│   └── SettingsContext.tsx   # Global settings (brand, days)
└── prisma/
    └── schema.prisma         # Database schema
\`\`\`

## Key Components

### KPICard
\`\`\`tsx
<KPICard
  title="Share of Voice"
  value={38}
  change={2.4}
  format="percent"
  sparklineData={[32, 34, 33, 35, 36, 37, 38]}
  priorSparklineData={[28, 29, 30, 31, 30, 32, 33]}
/>
\`\`\`

### Global Date Range
All components accept a \`days\` prop from the parent page:
\`\`\`tsx
<ExecutiveSummary days={days} />
<SpikeAlerts days={days} />
<CompetitorBattlecard days={days} />
<PurchaseIntentSignals days={days} />
\`\`\`

## Data Sources

Currently using mock data for demonstration. Designed to integrate with:
- YouTube Data API
- Reddit API
- News APIs (NewsAPI, Bing News)
- Beauty review sites (MakeupAlley, Temptalia)

## Environment Variables

\`\`\`env
DATABASE_URL=postgresql://...
\`\`\`

## Development

\`\`\`bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
\`\`\`

## Deployment

Deployed on Railway with automatic deployments from the \`main\` branch.

\`\`\`bash
# Push to deploy
git push origin main
\`\`\`

## Brand Configuration

Switch between brands in Settings or via the sidebar:
- **Revlon** - Hair tools, lipsticks, foundation
- **e.l.f.** - Viral products, dupes, affordable luxury
- **Maybelline** - Mascara, foundation, lip products

## Recent Updates

- Global date range controls all components
- Stackline-style sparklines in KPI cards
- Grouped bar chart for mentions (current vs prior period)
- Stackline color palette (navy, teal, gold)
- Purchase Intent Signals vary by date range
- Date filtering on Mentions page
- Roboto font throughout

## Credits

Built for Stackline VP presentation demo. Design inspired by Stackline Atlas dashboard.

---

**Repository**: https://github.com/amryhamad1992-svg/social-listener
