# How Gmail & Outlook Do It

Both clients use a prefetch + local encrypted cache model rather than fetching on demand:
Gmail prefetches email bodies for the top ~50 visible/recent emails in the background as soon as the inbox loads, stores them in an encrypted IndexedDB cache in the browser (or SQLite on mobile), and only hits the API again if the cache is stale or the email wasn't prefetched. The cache is keyed by message ID and tied to the authenticated session.
Outlook does something similar but also uses a sync state model via Microsoft Graph's delta queries — it continuously syncs a local copy of your mailbox in the background so that by the time you click an email, the body is already local. On mobile, this is stored in an encrypted on-device database.
The key insight is: neither client fetches the body when you click. The fetch already happened proactively.

## The Security-First Approach for Your App

1. Encrypt at Rest in Supabase (for summaries/previews only)
   Never store the full raw email body. Instead store only what your app generated from it — AI summaries, snippets, etc. — encrypted using Supabase's pgcrypto:

```sql
-- Enable pgcrypto
create extension if not exists pgcrypto;

-- Store only encrypted preview snippets, never the full body
alter table email_metadata
  add column body_preview_encrypted bytea, -- first ~200 chars only
  add column encryption_key_id text; -- reference to which key was used
```

```typescript
// Encrypt before storing
const encryptedPreview = await supabase.rpc("encrypt_preview", {
  content: emailBody.substring(0, 200),
  key: userDerivedKey, // derived from user's session, not stored server-side
});
```

The important distinction: the encryption key should be derived from the user's session/auth token, not stored in your database. That way even if your DB is compromised, the previews are useless without the user's key.

2. Client-Side Session Cache (The Performance Fix)
   This is the biggest win for your delay problem. Cache decrypted bodies in memory on the client for the duration of the session — never persisted to disk:

```typescript
class EmailBodyCache {
  private cache = new Map<string, { body: string; fetchedAt: number }>();
  private TTL = 1000 * 60 * 15; // 15 minute TTL

  async getBody(messageId: string, userId: string): Promise<string> {
    const cached = this.cache.get(messageId);
    const isValid = cached && Date.now() - cached.fetchedAt < this.TTL;

    if (isValid) return cached.body; // instant, no API call

    // Cache miss — fetch from Outlook
    const body = await fetchFromOutlookAPI(messageId, userId);
    this.cache.set(messageId, { body, fetchedAt: Date.now() });
    return body;
  }

  invalidate(messageId: string) {
    this.cache.delete(messageId);
  }

  clear() {
    this.cache.clear(); // call this on logout
  }
}

export const emailCache = new EmailBodyCache();
```

This lives in memory only — no localStorage, no IndexedDB, no disk. When the user closes the tab or logs out, it's gone. Zero persistence risk.

3. Prefetch on Inbox Load (Eliminate the Click Delay)
   Instead of fetching when the user clicks on an email, prefetch the top N emails while the inbox is rendering:

```typescript
async function prefetchVisibleEmails(messageIds: string[]) {
  // Fetch top 20 in parallel, but throttled to avoid hammering the API
  const chunks = chunkArray(messageIds.slice(0, 20), 5); // 5 at a time

  for (const chunk of chunks) {
    await Promise.all(chunk.map((id) => emailCache.getBody(id, currentUserId)));
  }
}

// Call this after inbox renders
useEffect(() => {
  if (visibleEmails.length > 0) {
    prefetchVisibleEmails(visibleEmails.map((e) => e.outlookMessageId));
  }
}, [visibleEmails]);
```

By the time the user clicks an email, it's already in the in-memory cache and renders instantly.

### 4. Secure Token Handling for Outlook API Calls

The other security concern is that every body fetch requires a valid Outlook OAuth token. Never expose that token to your frontend directly — proxy it through your backend:

User clicks email
↓
Your frontend → Your Supabase Edge Function (has the token server-side)
↓
Edge Function → Microsoft Graph API
↓
Edge Function returns body → Frontend (over HTTPS only)

```typescript
// supabase/functions/fetch-email-body/index.ts
Deno.serve(async (req) => {
  const { messageId } = await req.json();

  // Validate the user's Supabase session
  const supabase = createClient(/* ... */);
  const {
    data: { user },
  } = await supabase.auth.getUser(
    req.headers.get("Authorization")?.replace("Bearer ", ""),
  );

  if (!user) return new Response("Unauthorized", { status: 401 });

  // Fetch the stored (encrypted) Outlook token for this user
  const outlookToken = await getDecryptedOutlookToken(user.id);

  // Fetch from Microsoft Graph server-side
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/messages/${messageId}?$select=body`,
    { headers: { Authorization: `Bearer ${outlookToken}` } },
  );

  const email = await response.json();
  return new Response(JSON.stringify({ body: email.body.content }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

## Summary of the Full Strategy

The layered approach works like this: prefetch bodies in the background when the inbox loads, hold them in an in-memory session cache so clicks feel instant, proxy all Outlook API calls through your backend so tokens never touch the frontend, and only store AI-generated outputs (summaries, tags, priority scores) in Supabase — never the raw body. If you do need to store any preview snippets, encrypt them with a key derived from the user's session so they're useless without an authenticated user.

This mirrors exactly what Gmail and Outlook do, keeps your API call count minimal, and means sensitive email content never sits unprotected in a database or browser storage.
