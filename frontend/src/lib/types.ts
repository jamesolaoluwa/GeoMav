export interface Business {
  id: string;
  name: string;
  website: string;
  category: string;
  user_id: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  created_at: string;
}

export interface Query {
  id: string;
  text: string;
  category: string;
  business_id: string;
  created_at: string;
}

export interface LLMResponse {
  id: string;
  query_id: string;
  llm_name: LLMName;
  response_text: string;
  created_at: string;
}

export type LLMName = "ChatGPT" | "Gemini" | "Claude" | "Perplexity" | "Bing" | "DeepSeek";

export interface Mention {
  id: string;
  business_id: string;
  response_id: string;
  rank: number;
  sentiment: Sentiment;
  created_at: string;
}

export type Sentiment = "positive" | "neutral" | "negative";

export interface Claim {
  id: string;
  response_id: string;
  claim_type: string;
  claim_value: string;
  verified_value: string;
  status: ClaimStatus;
  llm_name?: LLMName;
  query_text?: string;
  created_at: string;
}

export type ClaimStatus = "pending" | "correction_deployed" | "resolved";

export interface DashboardMetrics {
  visibility_score: number;
  visibility_change: number;
  brand_ranking: number;
  brand_ranking_total: number;
  claim_accuracy: number;
  claim_accuracy_change: number;
  active_hallucinations: number;
}

export interface VisibilityTrend {
  date: string;
  score: number;
}

export interface LLMBreakdown {
  llm_name: LLMName;
  mention_rate: number;
  total_queries: number;
  avg_rank: number;
}

export interface CompetitorVisibility {
  name: string;
  visibility_score: number;
  change: number;
}

export interface QueryResponse {
  id: string;
  query: string;
  llm_name: LLMName;
  brand_mentioned: boolean;
  rank: number | null;
  sentiment: Sentiment;
}

export interface TopicRanking {
  topic: string;
  status: "strong" | "needs_work" | "not_ranked";
  rankings: { rank: number; brand: string; logo?: string }[];
}

export interface SentimentTrend {
  date: string;
  positive: number;
  neutral: number;
  negative: number;
}

export interface SentimentByLLM {
  llm_name: LLMName;
  positive: number;
  neutral: number;
  negative: number;
}

export interface ShoppingResult {
  id: string;
  query: string;
  llm_name: LLMName;
  product_mentioned: string;
  rank: number | null;
  context: string;
}

export interface Opportunity {
  id: string;
  category: "missing_mention" | "low_sentiment" | "hallucination" | "content_gap";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  status: "open" | "in_progress" | "completed";
  suggested_fix: string;
}

export interface ContentSection {
  id: string;
  type: "summary" | "llms_txt" | "json_ld";
  title: string;
  content: string;
  updated_at: string;
}

export interface Prompt {
  id: string;
  text: string;
  category: string;
  created_at: string;
}

export type TimeFilter = "all_time" | "daily" | "weekly";
