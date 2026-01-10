declare module 'google-trends-api' {
  interface TrendsOptions {
    keyword?: string | string[];
    geo?: string;
    startTime?: Date;
    endTime?: Date;
    category?: number;
    hl?: string;
    timezone?: number;
    granularTimeResolution?: boolean;
  }

  interface RealTimeTrendsOptions {
    geo?: string;
    category?: string;
    hl?: string;
  }

  interface DailyTrendsOptions {
    geo?: string;
    trendDate?: Date;
    hl?: string;
  }

  interface RelatedQueriesOptions extends TrendsOptions {}

  interface RelatedTopicsOptions extends TrendsOptions {}

  const googleTrends: {
    interestOverTime(options: TrendsOptions): Promise<string>;
    interestByRegion(options: TrendsOptions): Promise<string>;
    relatedQueries(options: RelatedQueriesOptions): Promise<string>;
    relatedTopics(options: RelatedTopicsOptions): Promise<string>;
    realTimeTrends(options: RealTimeTrendsOptions): Promise<string>;
    dailyTrends(options: DailyTrendsOptions): Promise<string>;
    autoComplete(options: { keyword: string }): Promise<string>;
  };

  export = googleTrends;
}
