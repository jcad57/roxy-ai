**DO NOT MAKE ANY CHANGES TO THIS FILE**

The following document outlines the architecture for fetching and managing Outlook's Azure API.

# Fetching new emails

## Loading State

1. We should always display loading indicators to signal to the user something is happening. Follow these two paths:
   - Display a full page loader if we are loading the app and fetching emails for the first time or the user refreshes their browser.
   - Otherwise we should display loading indicators inside the **container** for the emails. This will occur if the user manually tries to refresh or refetch new emails with the "refresh emails" functionality we will be adding inside the dashboard.
2. Approach UI handling as a senior level front end NextJS developer.

## Architecture for fetching emails from an API

1. Display loading indicator in the UI based on the criteria inside the **loading state** section above.
2. Verify there is a valid session and the user is logged in.
3. Follow security best practices to avoid any kind of data leaks or potential for other people to obtain & view sensitive user emails.
4. Make a single API call using the dedicated API route inside app/api/emails/fetch-emails to the outlook azure API. If it doesn't exist, create this route. Also keep in mind we will be adding other email clients like google in the future. Optimize this API route to scale up to handle whatever client API we need to access.
5. Avoid multiple fetch attempts - if there are errors fetching, they should be displayed in the UI to the user if related to user issues (not signed in, not authenticated with outlook, unable to find email) or displayed in the UI **and** console if there are internal fetching errors (database problems, connection issues, etc.). They should be displayed elegantly to the user so they can understand with instructions on how to resolve issue.
6. Avoid any kind of flickering in the UI. The loading state should persist, whether full page or inside a component, until successful fetching completes or until an error is found.
7. This process should be efficient and robust. Approach this as a senior NextJS AI-powered email app developer.

## Handling different fetch cases

### Initial fetching for new users

1. Follow the **Architecture for fetching emails from an API** steps for the initial fetch request after a user succesfully signs up and has connected their email account to this app. Reference context/user-auth-architecture.md to understand auth flow.
2. If success, route to the dashboard and display emails in correct containers dependent on the view selected by the user. They should always be displayed in chronological order like any email client would unless the user has selected a sorting option in the dashboard.
3. If error, we should route to an error page that lets the user know what happened and how to resolve the issue.
4. **On the first initial fetch for new users, only fetch the most recent 100 emails from the email client.** This can be something adjusted later down the road after testing. Then allow all new emails to be fetched moving forward.

### User-induced email fetch request

1. We will be implementing a "refresh" or "refetch" feature that will allow users to fetch new emails.
2. This will allow us to make a single API request for new emails only. Follow the **Architecture for fetching emails from an API** section
3. Remember, to follow **Loading State** steps above for proper UI rendering.

## Efficiency with email storage

To ensure we are always displaying accurate data from their email client, we need a robust and secure way to manage emails. I'll divert this to your best judgement for now so long as you follow security best practices. Keep the following in mind:

Review context/Email-AI-Analysis-Architecture.md for referencing what and how we use AI for.

1. We need to remain in sync with the user's email client. We should never have a opportunity present itself that causes our app to be severly out of sync with their email client. Ensure we are automatically refetching emails every few seconds. This process should be efficient and streamlined so that we do not disrupt the UX for the user.
2. Emails need to be stored in a way that allows us to optimize the AI analysis process. This will let us avoid unneccessary API requests to AI models to keep AI costs to a minimum.
3. The core idea is simple: store lightweight metadata about each email (not the content itself) and use a status flag to track AI enrichment state.
4. You never store the raw email body. The Outlook message ID is your source of truth — your app fetches the actual content from Microsoft's API on demand. This keeps your database lean, avoids security/compliance headaches with storing PII, and means your Supabase storage costs stay minimal.
5. The unique(user_id, outlook_message_id) constraint is the most important piece. It makes your deduplication check an O(1) indexed lookup instead of a scan.
6. Batch process emails as often as possible vs checking each one individually.
7. Handle the failed status — set a retry_count column and only retry up to 2-3 times before marking as skipped. Otherwise one bad email can keep burning AI credits.
8. Sync delta, not full mailbox — when syncing from Outlook, use the Microsoft Graph delta query (/me/mailFolders/inbox/messages/delta) so you only fetch new or changed emails since the last sync, not the entire inbox each time. Store the deltaLink token in a user_sync_state table per user.

This setup means your AI enrichment cost scales with new unique emails, not with how many times your app queries or displays them.

**PSEUDO CODE TEMPLATE:**

```
async function processEmail(userId: string, outlookMessageId: string) {
  // 1. Upsert a row — do nothing if already enriched
  const { data, error } = await supabase
    .from('email_metadata')
    .upsert(
      { user_id: userId, outlook_message_id: outlookMessageId, ai_status: 'pending' },
      {
        onConflict: 'user_id, outlook_message_id',
        ignoreDuplicates: true  // if row exists, skip entirely
      }
    )
    .select('ai_status')
    .single();

  // 2. Check if it needs enrichment
  if (!data || data.ai_status === 'enriched') {
    return; // already done, no AI call made
  }

  // 3. Mark as processing (prevents duplicate jobs if you have concurrent workers)
  await supabase
    .from('email_metadata')
    .update({ ai_status: 'processing' })
    .eq('user_id', userId)
    .eq('outlook_message_id', outlookMessageId)
    .eq('ai_status', 'pending'); // only claim it if still pending

  // 4. Fetch email content from Outlook API (not from your DB)
  const emailContent = await fetchFromOutlook(outlookMessageId);

  // 5. Run AI enrichment
  const enrichment = await runAIEnrichment(emailContent);

  // 6. Store only the AI outputs, not the raw content
  await supabase
    .from('email_metadata')
    .update({
      ai_status: 'enriched',
      ai_enriched_at: new Date().toISOString(),
      ai_model_version: 'claude-sonnet-4-6',
      priority_score: enrichment.priority,
      category: enrichment.category,
      suggested_labels: enrichment.labels,
      summary: enrichment.summary,
    })
    .eq('user_id', userId)
    .eq('outlook_message_id', outlookMessageId);
}
```

**Batch processing PSEUDO CODE:**

```
async function getBatchToEnrich(userId: string, batchSize = 50) {
  const { data } = await supabase
    .from('email_metadata')
    .select('outlook_message_id')
    .eq('user_id', userId)
    .eq('ai_status', 'pending')
    .order('received_at', { ascending: false }) // prioritize recent emails
    .limit(batchSize);

  return data;
}
```
