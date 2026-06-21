/**
 * Type definitions for web scraping services
 */

export interface GoogleTrendsData {
  keywords: string[];
  trendScore: number;
  relatedQueries: string[];
  region?: string;
  timeframe?: string;
}

export interface RedditPost {
  title: string;
  upvotes: number;
  url: string;
  commentCount: number;
  author?: string;
  created?: Date;
  subreddit?: string;
}

export interface RedditData {
  topPosts: RedditPost[];
  discussionSentiment: string;
  totalPosts?: number;
  subreddit?: string;
}

export interface YouTubeVideo {
  title: string;
  viewCount: number;
  likeCount: number;
  url: string;
  channelTitle?: string;
  publishedAt?: Date;
  description?: string;
  thumbnailUrl?: string;
}

export interface YouTubeData {
  trendingVideos: YouTubeVideo[];
  totalResults?: number;
  category?: string;
}

export interface TwitterThread {
  text: string;
  engagementCount: number;
  url: string;
  author?: string;
  created?: Date;
  retweetCount?: number;
  likeCount?: number;
}

export interface TwitterData {
  trendingHashtags: string[];
  viralThreads: TwitterThread[];
  totalThreads?: number;
}

export interface MultiSourceScrapingResult {
  googleTrends: GoogleTrendsData | null;
  reddit: RedditData | null;
  youtube: YouTubeData | null;
  twitter: TwitterData | null;
  errors: Record<string, string>;
  timestamp: Date;
}

export interface ScrapingOptions {
  timeout?: number;
  retries?: number;
  cache?: boolean;
}
