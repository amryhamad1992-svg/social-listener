// NewsAPI Integration
// Docs: https://newsapi.org/docs

const NEWS_API_KEY = process.env.NEWS_API_KEY;
const BASE_URL = 'https://newsapi.org/v2';

export interface NewsArticle {
  source: {
    id: string | null;
    name: string;
  };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

export interface NewsApiResponse {
  status: string;
  totalResults: number;
  articles: NewsArticle[];
}

export async function searchNews(
  query: string,
  options: {
    from?: string;
    to?: string;
    sortBy?: 'relevancy' | 'popularity' | 'publishedAt';
    pageSize?: number;
    page?: number;
  } = {}
): Promise<NewsApiResponse> {
  const {
    from,
    to,
    sortBy = 'publishedAt',
    pageSize = 20,
    page = 1,
  } = options;

  const params = new URLSearchParams({
    q: query,
    apiKey: NEWS_API_KEY || '',
    sortBy,
    pageSize: pageSize.toString(),
    page: page.toString(),
    language: 'en',
  });

  if (from) params.append('from', from);
  if (to) params.append('to', to);

  const response = await fetch(`${BASE_URL}/everything?${params}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch news');
  }

  return response.json();
}

export async function getTopHeadlines(
  options: {
    category?: 'business' | 'entertainment' | 'health' | 'science' | 'sports' | 'technology';
    country?: string;
    query?: string;
    pageSize?: number;
  } = {}
): Promise<NewsApiResponse> {
  const {
    category,
    country = 'us',
    query,
    pageSize = 20,
  } = options;

  const params = new URLSearchParams({
    apiKey: NEWS_API_KEY || '',
    country,
    pageSize: pageSize.toString(),
  });

  if (category) params.append('category', category);
  if (query) params.append('q', query);

  const response = await fetch(`${BASE_URL}/top-headlines?${params}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch headlines');
  }

  return response.json();
}

// Search for brand mentions in news
export async function searchBrandNews(
  brandKeywords: string[],
  days: number = 7
): Promise<NewsArticle[]> {
  const from = new Date();
  from.setDate(from.getDate() - days);

  // Build query with OR for multiple keywords
  const query = brandKeywords.join(' OR ');

  try {
    const response = await searchNews(query, {
      from: from.toISOString().split('T')[0],
      sortBy: 'publishedAt',
      pageSize: 50,
    });

    return response.articles;
  } catch (error) {
    console.error('Error fetching brand news:', error);
    return [];
  }
}
