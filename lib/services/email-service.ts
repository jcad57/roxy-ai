/**
 * Email Service Layer
 * High-level operations for email management
 */

import type { RawEmail, EmailAIEnrichment, EnrichedEmail } from '@/lib/types/email-raw';
import { EmailDB, EnrichmentDB } from './storage/indexeddb';

/**
 * Initialize email database with mock data if empty
 */
export async function initializeEmails(mockEmails: RawEmail[]): Promise<void> {
  const count = await EmailDB.count();
  
  if (count === 0) {
    console.log('📧 Initializing email database with', mockEmails.length, 'emails');
    await EmailDB.saveMany(mockEmails);
    console.log('✅ Email database initialized');
  } else {
    console.log('📧 Email database already initialized with', count, 'emails');
  }
}

/**
 * Get all emails enriched with AI data
 */
export async function getEnrichedEmails(): Promise<EnrichedEmail[]> {
  const [emails, enrichmentMap] = await Promise.all([
    EmailDB.getAll(),
    EnrichmentDB.getAll(),
  ]);

  return emails.map(email => ({
    ...email,
    enrichment: enrichmentMap.get(email.id),
  }));
}

/**
 * Get emails that need AI analysis
 */
export async function getEmailsNeedingAnalysis(): Promise<RawEmail[]> {
  const emails = await EmailDB.getAll();
  const needsAnalysis: RawEmail[] = [];

  for (const email of emails) {
    if (await EnrichmentDB.needsAnalysis(email.id)) {
      needsAnalysis.push(email);
    }
  }

  return needsAnalysis;
}

/**
 * Save AI enrichment for an email
 */
export async function saveEnrichment(enrichment: EmailAIEnrichment): Promise<void> {
  await EnrichmentDB.save(enrichment);
}

/**
 * Clear all AI enrichments (keep emails)
 */
export async function clearAIEnrichments(): Promise<void> {
  await EnrichmentDB.clear();
  console.log('🗑️  AI enrichments cleared');
}

/**
 * Clear all data
 */
export async function clearAllData(): Promise<void> {
  await EmailDB.clear();
  await EnrichmentDB.clear();
  console.log('🗑️  All data cleared');
}
