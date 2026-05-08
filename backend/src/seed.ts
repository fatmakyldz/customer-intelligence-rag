import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { HuggingFaceTransformersEmbeddings } from '@langchain/community/embeddings/hf_transformers';
import * as dotenv from 'dotenv';

dotenv.config();

const documents = [
  {
    content:
      "Customer feedback from Sarah at TechCorp: The new analytics dashboard is fantastic! It's significantly reduced the time our team spends generating weekly reports. We've gone from 4 hours to 30 minutes. The real-time data refresh is a game changer. We're planning to onboard two more teams next quarter.",
    source: 'customer_feedback',
    metadata: {
      type: 'feedback',
      customer: 'Sarah',
      company: 'TechCorp',
      sentiment: 'positive',
      date: '2024-01-15',
    },
  },
  {
    content:
      "Negative feedback from James at StartupXYZ: We've been hitting API rate limits almost daily during our peak processing hours (2-4 PM EST). The 1000 requests/hour limit on the standard tier is blocking our automated sync jobs. Our engineers have had to add manual retry logic and it's creating technical debt. We're seriously evaluating whether to switch to a competitor with higher limits or move to enterprise.",
    source: 'customer_feedback',
    metadata: {
      type: 'feedback',
      customer: 'James',
      company: 'StartupXYZ',
      sentiment: 'negative',
      date: '2024-01-20',
      issue: 'rate_limiting',
    },
  },
  {
    content:
      "Positive support feedback from Maria at HealthPlus: When we encountered a critical data migration issue last Friday evening, the support team responded within 15 minutes and had our system back online in under 2 hours. The engineer walked us through every step. This level of support is exactly why we renewed our enterprise contract for 3 more years.",
    source: 'customer_feedback',
    metadata: {
      type: 'feedback',
      customer: 'Maria',
      company: 'HealthPlus',
      sentiment: 'positive',
      category: 'support',
      date: '2024-02-01',
    },
  },
  {
    content:
      "Critical feedback from CTO at DataInc: We've experienced intermittent authentication failures affecting roughly 30% of our 200-person team over the past two weeks. The SSO integration with our Okta setup keeps dropping sessions every few hours. Our team is losing productivity and we've started receiving complaints from our CEO. We've submitted 3 support tickets with no resolution. We're evaluating alternatives and have a meeting with a competitor next week.",
    source: 'customer_feedback',
    metadata: {
      type: 'feedback',
      customer: 'Robert Chen',
      company: 'DataInc',
      sentiment: 'negative',
      issue: 'sso_authentication',
      date: '2024-02-10',
      churn_risk: 'high',
    },
  },
  {
    content:
      "Sales call summary - Acme Corp (500 employees, manufacturing sector): Discovery call with VP of Engineering David Park and IT Director Lisa Wong. They're looking to expand from their current 50-seat license to 200 seats company-wide. Key requirements: SSO via SAML with their Azure AD setup, SOC2 Type II compliance documentation, and dedicated customer success manager. Budget approved: $48,000/year. Current pain point is their legacy system that requires manual data exports. Timeline: want to go live by Q2 2024. Decision expected in 3 weeks. Strong buy signals throughout the call.",
    source: 'sales_call',
    metadata: {
      type: 'sales_call',
      company: 'Acme Corp',
      contact: 'David Park',
      deal_size: 48000,
      stage: 'proposal',
      date: '2024-01-25',
    },
  },
  {
    content:
      "Sales call summary - GlobalBank Financial Services: Participated in a 90-minute deep dive with their security and compliance team (5 attendees including CISO). They need: SOC2 Type II + ISO 27001 certifications, custom data residency in EU, audit log exports in SIEM-compatible format, and 99.99% uptime SLA. Currently evaluating us alongside two major competitors. They were particularly impressed by our API flexibility and custom webhook system. Budget: $120,000-180,000/year depending on configuration. Main blocker is our lack of EU data center - they need a commitment before next board meeting in 6 weeks.",
    source: 'sales_call',
    metadata: {
      type: 'sales_call',
      company: 'GlobalBank',
      contact: 'CISO team',
      deal_size: 150000,
      stage: 'evaluation',
      date: '2024-02-05',
      blocker: 'eu_data_residency',
    },
  },
  {
    content:
      "Sales call summary - RetailMax (retail chain, 300 stores): Follow-up call with CEO Patricia Mills and CFO. They love the product and their pilot team of 20 gave it 9/10 satisfaction scores. However, our quote of $35,000/year is 40% higher than their current solution. Competitor X is offering a similar feature set at $22,000. Patricia said: 'If you can get within 20% of that price, we're ready to sign today.' Our AE believes a one-time discount to $28,000 for a 2-year commitment would close the deal. Need VP approval for pricing exception. Strong product fit but price is the only blocker.",
    source: 'sales_call',
    metadata: {
      type: 'sales_call',
      company: 'RetailMax',
      contact: 'Patricia Mills',
      deal_size: 28000,
      stage: 'negotiation',
      date: '2024-02-08',
      blocker: 'pricing',
    },
  },
  {
    content:
      "API Rate Limits Documentation: Standard tier allows 1,000 API requests per hour with a burst limit of 100 requests per minute. Professional tier allows 5,000 requests per hour. Enterprise tier allows 10,000 requests per hour with custom burst limits available. Rate limit headers (X-RateLimit-Remaining, X-RateLimit-Reset) are included in every response. When limits are exceeded, the API returns HTTP 429 with a Retry-After header. For workloads requiring higher limits, contact sales@example.com. Webhook-based integrations do not count against rate limits.",
    source: 'documentation',
    metadata: {
      type: 'documentation',
      category: 'api',
      topic: 'rate_limits',
      version: '2.1',
    },
  },
  {
    content:
      "SSO Integration Guide: Our platform supports SAML 2.0 and OAuth 2.0 / OpenID Connect. For SAML 2.0 setup: obtain our Service Provider metadata URL from Settings > Security > SSO, configure your IdP (Okta, Azure AD, OneLogin supported) with our ACS URL and Entity ID, then upload the IdP metadata to complete setup. For OAuth 2.0: register a client application to receive client_id and client_secret, configure allowed redirect_uris, and implement the authorization code flow. JIT (Just-In-Time) provisioning is supported for automatic user creation on first login. SCIM 2.0 is available on Enterprise plans for automated user sync. Common troubleshooting: certificate expiry causes session drops - certificates should be rotated every 12 months.",
    source: 'documentation',
    metadata: {
      type: 'documentation',
      category: 'security',
      topic: 'sso_integration',
      version: '2.1',
    },
  },
  {
    content:
      "Data Retention and Compliance Documentation: Free tier retains all data for 30 days before automatic deletion. Standard tier retains data for 1 year. Enterprise tier offers configurable retention from 1 to 7 years with legal hold capabilities. GDPR compliance: all EU customer data is stored in Frankfurt, Germany (eu-central-1). Data deletion requests are processed within 30 days per GDPR Article 17 requirements. SOC2 Type II audit is conducted annually - latest report available under NDA. ISO 27001 certification is in progress, expected Q3 2024. For regulated industries (healthcare, finance): HIPAA BAA is available for Enterprise plans. Data export available in JSON, CSV, and Parquet formats.",
    source: 'documentation',
    metadata: {
      type: 'documentation',
      category: 'compliance',
      topic: 'data_retention',
      version: '2.1',
    },
  },
];

async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ragdb',
    ssl: false,
  });

  await dataSource.initialize();
  console.log('Database connected');

  const embeddings = new HuggingFaceTransformersEmbeddings({
    modelName: 'Xenova/all-MiniLM-L6-v2',
  });

  console.log(`Seeding ${documents.length} documents...`);

  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];
    console.log(`[${i + 1}/${documents.length}] Embedding: ${doc.metadata.type} - ${doc.source}`);

    const vector = await embeddings.embedQuery(doc.content);
    const vectorStr = `[${vector.join(',')}]`;

    await dataSource.query(
      `INSERT INTO documents (content, metadata, embedding, source)
       VALUES ($1, $2, $3::vector, $4)`,
      [doc.content, JSON.stringify(doc.metadata), vectorStr, doc.source],
    );
  }

  console.log('Seed complete!');
  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
