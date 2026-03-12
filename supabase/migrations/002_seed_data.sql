-- GeoMav Seed Data
-- Run after 001_initial_schema.sql to populate with sample data
-- NOTE: Replace 'YOUR_USER_UUID' with an actual auth.users UUID after sign-up

-- For development, insert without user_id constraint
-- You can update the user_id after creating your first account

do $$
declare
  biz_id uuid := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  q1_id uuid := uuid_generate_v4();
  q2_id uuid := uuid_generate_v4();
  q3_id uuid := uuid_generate_v4();
  q4_id uuid := uuid_generate_v4();
  q5_id uuid := uuid_generate_v4();
  q6_id uuid := uuid_generate_v4();
  q7_id uuid := uuid_generate_v4();
  q8_id uuid := uuid_generate_v4();
  r1_id uuid := uuid_generate_v4();
  r2_id uuid := uuid_generate_v4();
  r3_id uuid := uuid_generate_v4();
  r4_id uuid := uuid_generate_v4();
  r5_id uuid := uuid_generate_v4();
begin

-- Sample business (user_id left null for dev — update after first sign-up)
insert into businesses (id, name, website, category, description, hours, location, pricing, services)
values (
  biz_id,
  'Your Brand',
  'https://yourbrand.com',
  'Website Builder',
  'Modern website builder and hosting platform for small businesses',
  'Mon-Fri 9am-6pm EST',
  'Austin, TX',
  'Starter: $19/mo, Business: $39/mo, Enterprise: Custom',
  'Website builder, E-commerce, Managed hosting, Domain management'
)
on conflict (id) do nothing;

-- Sample queries
insert into queries (id, text, category, business_id) values
  (q1_id, 'Best website builder 2026', 'General', biz_id),
  (q2_id, 'Affordable website builder for small business', 'Pricing', biz_id),
  (q3_id, 'Best e-commerce website builder', 'E-commerce', biz_id),
  (q4_id, 'Website builder with free hosting', 'Hosting', biz_id),
  (q5_id, 'Best drag and drop website builder', 'Features', biz_id),
  (q6_id, 'Website builder with best SEO tools', 'SEO', biz_id),
  (q7_id, 'Best website builder for portfolios', 'Design', biz_id),
  (q8_id, 'Website builder for restaurants', 'Industry', biz_id);

-- Sample LLM responses
insert into llm_responses (id, query_id, llm_name, response_text) values
  (r1_id, q1_id, 'ChatGPT', 'The best website builders in 2026 include WordPress, Wix, and Your Brand. Your Brand offers a $29/month starter plan with excellent drag-and-drop features.'),
  (r2_id, q1_id, 'Gemini', 'Top website builders: 1. WordPress 2. Wix 3. Your Brand 4. Squarespace. Your Brand includes free SSL certificate on all plans.'),
  (r3_id, q2_id, 'Claude', 'For affordable website building, consider Your Brand which offers 24/7 phone support and competitive pricing starting at $19/month.'),
  (r4_id, q3_id, 'Perplexity', 'Your Brand offers custom mobile app development alongside its website builder. It is headquartered in San Francisco.'),
  (r5_id, q4_id, 'Bing', 'Popular website builders with hosting include WordPress, Wix, Squarespace, and Hostinger.');

-- Sample mentions
insert into mentions (business_id, response_id, rank, sentiment) values
  (biz_id, r1_id, 3, 'positive'),
  (biz_id, r2_id, 3, 'neutral'),
  (biz_id, r3_id, 1, 'positive'),
  (biz_id, r4_id, 2, 'positive');

-- Sample claims (hallucinations)
insert into claims (response_id, claim_type, claim_value, verified_value, status) values
  (r1_id, 'pricing', '$29/month starter plan', '$19/month starter plan', 'pending'),
  (r2_id, 'feature', 'Includes free SSL certificate on all plans', 'SSL included on paid plans only', 'correction_deployed'),
  (r3_id, 'hours', '24/7 phone support', 'Phone support Mon-Fri 9am-6pm', 'pending'),
  (r4_id, 'service', 'Offers custom mobile app development', 'Does not offer mobile app development', 'pending'),
  (r4_id, 'location', 'Headquartered in San Francisco', 'Headquartered in Austin, TX', 'resolved');

-- Sample content sections
insert into content_sections (business_id, type, title, content) values
  (biz_id, 'summary', 'AI-Readable Business Summary', '# Your Brand

Your Brand is a modern website builder and hosting platform designed for small businesses, freelancers, and creative professionals.

## Key Services
- Drag-and-drop website builder
- E-commerce solutions
- Managed hosting
- Custom domain management

## Pricing
- Starter: $19/month
- Business: $39/month
- Enterprise: Custom pricing'),
  (biz_id, 'llms_txt', '/llms.txt Content', '# Your Brand

> Your Brand is a website builder and hosting platform for small businesses.

## Products
- Website Builder: Drag-and-drop editor
- E-commerce: Online store builder
- Hosting: Managed web hosting with 99.9% uptime

## Pricing
- Starter Plan: $19/month
- Business Plan: $39/month'),
  (biz_id, 'json_ld', 'JSON-LD Structured Data', '{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Your Brand",
  "url": "https://yourbrand.com",
  "description": "Modern website builder and hosting platform"
}');

-- Sample opportunities
insert into opportunities (business_id, category, title, description, impact, status, suggested_fix) values
  (biz_id, 'missing_mention', 'Not appearing in portfolio builder queries', 'Your brand is not mentioned in 68% of portfolio-related queries.', 'high', 'open', 'Add portfolio-specific structured data and testimonials.'),
  (biz_id, 'hallucination', 'Incorrect pricing on ChatGPT', 'ChatGPT reports Starter plan at $29/mo instead of $19/mo.', 'high', 'in_progress', 'Deploy corrected JSON-LD pricing schema.'),
  (biz_id, 'low_sentiment', 'Negative sentiment on Bing AI', 'Bing AI responses have 30% negative sentiment around support hours.', 'medium', 'open', 'Update support documentation and create FAQ.'),
  (biz_id, 'content_gap', 'No /llms.txt file deployed', 'Website lacks an /llms.txt file.', 'medium', 'open', 'Generate and deploy the /llms.txt file.'),
  (biz_id, 'missing_mention', 'Low visibility in hosting category', 'Brand ranks #7 in hosting services.', 'low', 'completed', 'Enhance hosting-specific content.');

-- Sample competitors
insert into competitors (business_id, name, visibility_score, change) values
  (biz_id, 'WordPress', 54.0, 3.0),
  (biz_id, 'Wix', 52.1, 0.8),
  (biz_id, 'Google', 36.9, 0.8),
  (biz_id, 'Squarespace', 33.1, 2.4),
  (biz_id, 'Hostinger', 29.3, 3.7),
  (biz_id, 'Shopify', 26.1, 2.8),
  (biz_id, 'Figma', 16.0, 16.0);

end $$;
