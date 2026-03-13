import type {
  DashboardMetrics,
  VisibilityTrend,
  LLMBreakdown,
  CompetitorVisibility,
  Claim,
  QueryResponse,
  TopicRanking,
  SentimentTrend,
  SentimentByLLM,
  ShoppingResult,
  Opportunity,
  ContentSection,
  Prompt,
  UserProfile,
} from "@/lib/types";

export const mockDashboardMetrics: DashboardMetrics = {
  visibility_score: 40.4,
  visibility_change: -0.4,
  brand_ranking: 3,
  brand_ranking_total: 8,
  claim_accuracy: 87.2,
  claim_accuracy_change: 2.1,
  active_hallucinations: 5,
};

export const mockVisibilityTrend: VisibilityTrend[] = [
  { date: "Feb 1", score: 38.2 },
  { date: "Feb 2", score: 41.5 },
  { date: "Feb 3", score: 42.8 },
  { date: "Feb 4", score: 43.1 },
  { date: "Feb 5", score: 37.6 },
  { date: "Feb 6", score: 35.2 },
  { date: "Feb 7", score: 39.8 },
  { date: "Feb 8", score: 40.4 },
];

export const mockLLMBreakdown: LLMBreakdown[] = [
  { llm_name: "ChatGPT", mention_rate: 52.3, total_queries: 128, avg_rank: 3.2 },
  { llm_name: "Gemini", mention_rate: 44.1, total_queries: 112, avg_rank: 4.1 },
  { llm_name: "Claude", mention_rate: 38.7, total_queries: 95, avg_rank: 3.8 },
  { llm_name: "Perplexity", mention_rate: 61.2, total_queries: 89, avg_rank: 2.5 },
  { llm_name: "Bing", mention_rate: 29.4, total_queries: 76, avg_rank: 5.3 },
  { llm_name: "DeepSeek", mention_rate: 35.8, total_queries: 64, avg_rank: 4.5 },
];

export const mockCompetitors: CompetitorVisibility[] = [
  { name: "WordPress", visibility_score: 54.0, change: 3.0 },
  { name: "Wix", visibility_score: 52.1, change: 0.8 },
  { name: "Your Brand", visibility_score: 40.4, change: -0.4 },
  { name: "Google", visibility_score: 36.9, change: 0.8 },
  { name: "Squarespace", visibility_score: 33.1, change: 2.4 },
  { name: "Hostinger", visibility_score: 29.3, change: 3.7 },
  { name: "Shopify", visibility_score: 26.1, change: 2.8 },
  { name: "Figma", visibility_score: 16.0, change: 16.0 },
];

export const mockHallucinations: Claim[] = [
  {
    id: "h1",
    response_id: "r1",
    claim_type: "pricing",
    claim_value: "$29/month starter plan",
    verified_value: "$19/month starter plan",
    status: "pending",
    llm_name: "ChatGPT",
    query_text: "Best website builder pricing",
    created_at: "2026-03-10T14:22:00Z",
  },
  {
    id: "h2",
    response_id: "r2",
    claim_type: "feature",
    claim_value: "Includes free SSL certificate",
    verified_value: "SSL included on paid plans only",
    status: "correction_deployed",
    llm_name: "Gemini",
    query_text: "Website builder with free SSL",
    created_at: "2026-03-09T10:15:00Z",
  },
  {
    id: "h3",
    response_id: "r3",
    claim_type: "hours",
    claim_value: "24/7 phone support",
    verified_value: "Phone support Mon-Fri 9am-6pm",
    status: "pending",
    llm_name: "Claude",
    query_text: "Best website builder with support",
    created_at: "2026-03-08T16:40:00Z",
  },
  {
    id: "h4",
    response_id: "r4",
    claim_type: "service",
    claim_value: "Offers custom mobile app development",
    verified_value: "Does not offer mobile app development",
    status: "pending",
    llm_name: "Perplexity",
    query_text: "Website builder with mobile app",
    created_at: "2026-03-07T09:30:00Z",
  },
  {
    id: "h5",
    response_id: "r5",
    claim_type: "location",
    claim_value: "Headquartered in San Francisco",
    verified_value: "Headquartered in Austin, TX",
    status: "resolved",
    llm_name: "Bing",
    query_text: "Where is this company based",
    created_at: "2026-03-06T11:05:00Z",
  },
];

export const mockQueryResponses: QueryResponse[] = [
  { id: "qr1", query: "Best website builder 2026", llm_name: "ChatGPT", brand_mentioned: true, rank: 3, sentiment: "positive" },
  { id: "qr2", query: "Best website builder 2026", llm_name: "Gemini", brand_mentioned: true, rank: 5, sentiment: "neutral" },
  { id: "qr3", query: "Best website builder 2026", llm_name: "Claude", brand_mentioned: true, rank: 2, sentiment: "positive" },
  { id: "qr4", query: "Affordable website builder", llm_name: "ChatGPT", brand_mentioned: false, rank: null, sentiment: "neutral" },
  { id: "qr5", query: "Affordable website builder", llm_name: "Perplexity", brand_mentioned: true, rank: 4, sentiment: "positive" },
  { id: "qr6", query: "Website builder for small business", llm_name: "Gemini", brand_mentioned: true, rank: 3, sentiment: "positive" },
  { id: "qr7", query: "Website builder for small business", llm_name: "Bing", brand_mentioned: false, rank: null, sentiment: "negative" },
  { id: "qr8", query: "E-commerce website builder", llm_name: "Claude", brand_mentioned: true, rank: 6, sentiment: "neutral" },
  { id: "qr9", query: "E-commerce website builder", llm_name: "ChatGPT", brand_mentioned: true, rank: 4, sentiment: "positive" },
  { id: "qr10", query: "Best drag and drop builder", llm_name: "Perplexity", brand_mentioned: true, rank: 1, sentiment: "positive" },
];

export const mockTopicRankings: TopicRanking[] = [
  {
    topic: "Client Collaboration Tools",
    status: "needs_work",
    rankings: [
      { rank: 1, brand: "Notion" },
      { rank: 2, brand: "Wix" },
      { rank: 3, brand: "Your Brand" },
      { rank: 4, brand: "WordPress" },
      { rank: 5, brand: "Canva" },
      { rank: 6, brand: "Trello" },
      { rank: 7, brand: "Figma" },
      { rank: 8, brand: "Asana" },
      { rank: 9, brand: "Slack" },
      { rank: 10, brand: "Monday" },
    ],
  },
  {
    topic: "Hosting Services",
    status: "needs_work",
    rankings: [
      { rank: 1, brand: "WordPress" },
      { rank: 2, brand: "Hostinger" },
      { rank: 3, brand: "Wix" },
      { rank: 4, brand: "Squarespace" },
      { rank: 5, brand: "GoDaddy" },
      { rank: 6, brand: "Bluehost" },
      { rank: 7, brand: "Your Brand" },
      { rank: 8, brand: "DigitalOcean" },
      { rank: 9, brand: "Google" },
      { rank: 10, brand: "AWS" },
    ],
  },
  {
    topic: "E-commerce Platforms",
    status: "strong",
    rankings: [
      { rank: 1, brand: "Shopify" },
      { rank: 2, brand: "Your Brand" },
      { rank: 3, brand: "WooCommerce" },
      { rank: 4, brand: "Squarespace" },
      { rank: 5, brand: "BigCommerce" },
      { rank: 6, brand: "Wix" },
      { rank: 7, brand: "Magento" },
      { rank: 8, brand: "PrestaShop" },
      { rank: 9, brand: "Volusion" },
      { rank: 10, brand: "3dcart" },
    ],
  },
  {
    topic: "Design Tools",
    status: "not_ranked",
    rankings: [
      { rank: 1, brand: "Figma" },
      { rank: 2, brand: "Canva" },
      { rank: 3, brand: "Adobe" },
      { rank: 4, brand: "Sketch" },
      { rank: 5, brand: "InVision" },
      { rank: 6, brand: "Framer" },
      { rank: 7, brand: "Webflow" },
      { rank: 8, brand: "Wix" },
      { rank: 9, brand: "Squarespace" },
      { rank: 10, brand: "WordPress" },
    ],
  },
  {
    topic: "SEO Tools",
    status: "needs_work",
    rankings: [
      { rank: 1, brand: "Ahrefs" },
      { rank: 2, brand: "SEMrush" },
      { rank: 3, brand: "Moz" },
      { rank: 4, brand: "Your Brand" },
      { rank: 5, brand: "Yoast" },
      { rank: 6, brand: "Screaming Frog" },
      { rank: 7, brand: "Google" },
      { rank: 8, brand: "Surfer" },
      { rank: 9, brand: "Ubersuggest" },
      { rank: 10, brand: "Majestic" },
    ],
  },
];

export const mockSentimentTrend: SentimentTrend[] = [
  { date: "Feb 1", positive: 45, neutral: 35, negative: 20 },
  { date: "Feb 2", positive: 48, neutral: 32, negative: 20 },
  { date: "Feb 3", positive: 52, neutral: 30, negative: 18 },
  { date: "Feb 4", positive: 50, neutral: 33, negative: 17 },
  { date: "Feb 5", positive: 44, neutral: 36, negative: 20 },
  { date: "Feb 6", positive: 42, neutral: 38, negative: 20 },
  { date: "Feb 7", positive: 47, neutral: 34, negative: 19 },
  { date: "Feb 8", positive: 49, neutral: 33, negative: 18 },
];

export const mockSentimentByLLM: SentimentByLLM[] = [
  { llm_name: "ChatGPT", positive: 55, neutral: 30, negative: 15 },
  { llm_name: "Gemini", positive: 40, neutral: 38, negative: 22 },
  { llm_name: "Claude", positive: 62, neutral: 28, negative: 10 },
  { llm_name: "Perplexity", positive: 58, neutral: 30, negative: 12 },
  { llm_name: "Bing", positive: 30, neutral: 40, negative: 30 },
  { llm_name: "DeepSeek", positive: 48, neutral: 35, negative: 17 },
];

export const mockShoppingResults: ShoppingResult[] = [
  { id: "s1", query: "Best website builder for online store", llm_name: "ChatGPT", product_mentioned: "E-commerce Plan", rank: 3, context: "Recommended for small to medium online stores with drag-and-drop functionality." },
  { id: "s2", query: "Cheapest website hosting with builder", llm_name: "Gemini", product_mentioned: "Starter Plan", rank: 5, context: "Listed as an affordable option for beginners." },
  { id: "s3", query: "Best portfolio website builder", llm_name: "Claude", product_mentioned: "Portfolio Templates", rank: 2, context: "Praised for clean, modern portfolio templates." },
  { id: "s4", query: "Website builder with AI features", llm_name: "Perplexity", product_mentioned: "AI Page Builder", rank: 1, context: "Highlighted as a top AI-powered site builder." },
  { id: "s5", query: "Best website builder for restaurants", llm_name: "Bing", product_mentioned: "Business Plan", rank: null, context: "Not specifically mentioned for restaurant use." },
];

export const mockOpportunities: Opportunity[] = [
  {
    id: "o1",
    category: "missing_mention",
    title: "Not appearing in 'best portfolio builder' queries",
    description: "Your brand is not mentioned in 68% of portfolio-related queries across all LLMs.",
    impact: "high",
    status: "open",
    suggested_fix: "Add portfolio-specific structured data and customer testimonials to your site.",
  },
  {
    id: "o2",
    category: "hallucination",
    title: "Incorrect pricing on ChatGPT",
    description: "ChatGPT consistently reports your Starter plan at $29/mo instead of $19/mo.",
    impact: "high",
    status: "in_progress",
    suggested_fix: "Deploy corrected JSON-LD pricing schema and update FAQ page.",
  },
  {
    id: "o3",
    category: "low_sentiment",
    title: "Negative sentiment on Bing AI",
    description: "Bing AI responses about your brand have 30% negative sentiment, mostly around support hours.",
    impact: "medium",
    status: "open",
    suggested_fix: "Update support documentation and create structured FAQ about support availability.",
  },
  {
    id: "o4",
    category: "content_gap",
    title: "No /llms.txt file deployed",
    description: "Your website lacks an /llms.txt file that helps AI models understand your business accurately.",
    impact: "medium",
    status: "open",
    suggested_fix: "Generate and deploy the /llms.txt file from the Content page.",
  },
  {
    id: "o5",
    category: "missing_mention",
    title: "Low visibility in 'hosting services' category",
    description: "Your brand ranks #7 in hosting services, behind 6 competitors.",
    impact: "low",
    status: "completed",
    suggested_fix: "Enhance hosting-specific content and add comparison pages.",
  },
];

export const mockContentSections: ContentSection[] = [
  {
    id: "c1",
    type: "summary",
    title: "AI-Readable Business Summary",
    content: `# Your Brand\n\nYour Brand is a modern website builder and hosting platform designed for small businesses, freelancers, and creative professionals.\n\n## Key Services\n- Drag-and-drop website builder\n- E-commerce solutions\n- Managed hosting\n- Custom domain management\n\n## Pricing\n- Starter: $19/month\n- Business: $39/month\n- Enterprise: Custom pricing\n\n## Support\n- Email: 24/7\n- Phone: Mon-Fri 9am-6pm EST\n- Live Chat: Mon-Sat 8am-10pm EST`,
    updated_at: "2026-03-10T14:00:00Z",
  },
  {
    id: "c2",
    type: "llms_txt",
    title: "/llms.txt Content",
    content: `# Your Brand\n\n> Your Brand is a website builder and hosting platform for small businesses.\n\n## Products\n- Website Builder: Drag-and-drop editor for creating professional websites\n- E-commerce: Online store builder with payment processing\n- Hosting: Managed web hosting with 99.9% uptime\n\n## Pricing\n- Starter Plan: $19/month\n- Business Plan: $39/month\n- Enterprise: Custom\n\n## Contact\n- Website: https://yourbrand.com\n- Support: support@yourbrand.com`,
    updated_at: "2026-03-09T10:00:00Z",
  },
  {
    id: "c3",
    type: "json_ld",
    title: "JSON-LD Structured Data",
    content: `{\n  "@context": "https://schema.org",\n  "@type": "Organization",\n  "name": "Your Brand",\n  "url": "https://yourbrand.com",\n  "description": "Modern website builder and hosting platform",\n  "foundingDate": "2020",\n  "offers": [\n    {\n      "@type": "Offer",\n      "name": "Starter Plan",\n      "price": "19",\n      "priceCurrency": "USD",\n      "description": "Perfect for personal sites and portfolios"\n    },\n    {\n      "@type": "Offer",\n      "name": "Business Plan",\n      "price": "39",\n      "priceCurrency": "USD",\n      "description": "For growing businesses with e-commerce needs"\n    }\n  ]\n}`,
    updated_at: "2026-03-08T16:00:00Z",
  },
];

export const mockPrompts: Prompt[] = [
  { id: "p1", text: "Best website builder 2026", category: "General", created_at: "2026-03-01T00:00:00Z" },
  { id: "p2", text: "Affordable website builder for small business", category: "Pricing", created_at: "2026-03-01T00:00:00Z" },
  { id: "p3", text: "Best e-commerce website builder", category: "E-commerce", created_at: "2026-03-01T00:00:00Z" },
  { id: "p4", text: "Website builder with free hosting", category: "Hosting", created_at: "2026-03-01T00:00:00Z" },
  { id: "p5", text: "Best drag and drop website builder", category: "Features", created_at: "2026-03-01T00:00:00Z" },
  { id: "p6", text: "Website builder with best SEO tools", category: "SEO", created_at: "2026-03-02T00:00:00Z" },
  { id: "p7", text: "Best website builder for portfolios", category: "Design", created_at: "2026-03-02T00:00:00Z" },
  { id: "p8", text: "Website builder for restaurants", category: "Industry", created_at: "2026-03-03T00:00:00Z" },
];

export const mockBusinessProfile = {
  name: "Your Brand",
  website: "https://yourbrand.com",
  category: "Website Builder",
  description:
    "Your Brand is a modern website builder and hosting platform designed for small businesses, freelancers, and creative professionals.",
};

export const mockUser: UserProfile = {
  id: "demo-user-001",
  email: "demo@geomav.com",
  display_name: "Demo User",
  created_at: "2024-01-01T00:00:00Z",
};
