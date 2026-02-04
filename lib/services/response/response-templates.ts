/**
 * Response Templates
 * Fallback templates when AI is unavailable
 */

import type { EnrichedEmail } from '@/lib/types/email-raw';

/**
 * Generate a template-based response (fallback)
 */
export function generateTemplateResponse(email: EnrichedEmail): string {
  const firstName = email.from.name.split(' ')[0];
  const hasActionItems = (email.enrichment?.actionItems?.length || 0) > 0;
  const hasKeyDates = (email.enrichment?.keyDates?.length || 0) > 0;
  
  let response = `Hi ${firstName},\n\n`;
  
  if (hasActionItems) {
    response += `Thanks for your email. I've noted the following:\n\n`;
    email.enrichment?.actionItems?.forEach(item => {
      response += `• ${item.task}\n`;
    });
    response += `\nI'll follow up on these shortly.\n\n`;
  } else if (hasKeyDates) {
    response += `Thanks for reaching out. I've noted the dates mentioned and will ensure we're aligned.\n\n`;
  } else if (email.enrichment?.aiCategory === 'urgent') {
    response += `Thanks for flagging this. I understand the urgency and will prioritize accordingly.\n\n`;
  } else {
    response += `Thanks for your email. I'll review this and get back to you soon.\n\n`;
  }
  
  response += `Best regards`;
  
  return response;
}

/**
 * Generate quick reply templates
 */
export function generateQuickReplyTemplates(email: EnrichedEmail): Array<{
  text: string;
  icon: string;
}> {
  const templates = [];
  const category = email.enrichment?.aiCategory || 'work';
  const needsReply = email.enrichment?.needsReply;
  
  // Common quick replies
  templates.push(
    { text: "Thanks, I'll review by EOD", icon: '✓' },
    { text: "Looks good, approved!", icon: '👍' }
  );
  
  // Category-specific
  if (category === 'urgent') {
    templates.push(
      { text: "On it now, will update shortly", icon: '🚀' },
      { text: "Escalating this immediately", icon: '⚡' }
    );
  }
  
  if (email.enrichment?.keyDates && email.enrichment.keyDates.length > 0) {
    templates.push({ text: "Scheduled, see you then", icon: '📅' });
  }
  
  if (needsReply) {
    templates.push(
      { text: "Can we discuss this tomorrow?", icon: '💬' },
      { text: "Need more context on this", icon: '❓' }
    );
  }
  
  return templates.slice(0, 5); // Return max 5
}
