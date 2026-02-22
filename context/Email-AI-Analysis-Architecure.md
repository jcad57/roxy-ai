**DO NOT MAKE ANY CHANGES TO THIS FILE**

This file will outline how AI is used to enrich emails, apply suggested responses and priority filtering/sorting via context and how we will track which emails have been enriched or "touched" by AI.

# How AI will aid the user

There are several types of views a user can choose to use that will help them streamline their inbox experience. AI will decide priority for emails based on the context of the email message that can be filtered in the "priority view" to put the most important emails right in front of the user, generate quick replies for emails that may only require a simple response - saving the user time typing out responses, create to-do's for the user automatically if emails ask an "action" of the user or request attendance to meetings or other important dates, add context tags to emails to help the user sort them more effectively and efficiently, and AI summaries to help the user understand long email threads easily. Below you will find more details for these features:

Follow context/Email-Fetching-Architecture.md for details on how we should be fetching emails before continuing.

## Cost Strategy Summary

# Feature Model Trigger

Priority Score Haiku 4.5 Every new email (background)
Quick Reply Haiku 4.5 On demand per email
To-Do Detection Haiku 4.5 Every new email (background)
Context Tags Haiku 4.5 Every new email (background)
Thread Summary Sonnet 4.6 On demand only

The key architectural decision here is the trigger column. The four background tasks (priority, to-dos, tags, and technically pre-generating a quick reply draft) all run once when the email is first ingested and their results get stored in your email_metadata table from the previous design. You're paying for Haiku on those, which is roughly 20x cheaper per token than Sonnet, so running all four in a single combined prompt per email keeps costs very low.

## AI Priority

**AI Model: Claude Haiku 4.5**

1. This feature will allow AI to analyze an email message and set a priority level (0-100) based on the importance of that email.
2. It will consider the following things:
   - Deadlines (if a task is nearing a certain date)
   - Language used, ie: "urgent, still waiting on this, following up, etc."
   - Emails from specific people (boss, high value clients, etc.) This will coincide with a feature added later that let's users set high priority contacts.
3. The prompt used should allow the model to be fast and consistent with judgement reasoning and also handle batch reasoning.

## Quick Replies

**AI Model: Claude Haiku 4.5**

1. AI should summarize the context of all messages (thread or single) and generate a quick, easy and professional reply based on the context of the email thread/message.
2. Replies should sound natural and match the tone and address the the email's task.

## To-Do (Khan Ban Board)

**AI Model: Claude Haiku 4.5 with structured output**

1. When analyzing an email, the model will determine if a to-do item should be created and added to the Khan Ban Board view.
2. It should be clear that something needs to be done by a specific date.
3. When it's determined that a task needs to be added to Khan Ban Board, it should be added to the backlog column with the required details of the khan ban board feature.
4. The one exception would be complex multi-threaded email chains where context spans many messages; bump those specific cases to Sonnet.

## Context Tags

**AI Model: Claude Haiku 4.5**

1. Tagging is a multi-label classification task with a finite set of possible tags.
2. The finite set of tags should determined by the context tag taxonomy found in context/Context-Tag-Taxonomy.md
3. Every email should be analyzed and a context tag created.

## AI Thread Summaries

**AI Model: Claude Sonnet 4.6**

1. This will run once per thread. Entire thread context will be analyzed to create a concise summary highlighting what's going on in the thread to help the user understand without having to go through an entire thread.
2. We should only run this enrichment on threads that are 3 total message or more.

PSUEDO CODE EXAMPLE:

Combined Prompt Trick (Big Cost Saver)
Rather than making four separate Haiku API calls per email, combine all background enrichment into one call with structured output:

```typescript
const systemPrompt = `You are an email processing assistant. For each email, return a JSON object with:
- priority: integer 1-5 (5 = most urgent)
- priority_reason: string (one sentence)
- tags: array of strings from this list only: [Finance, Legal, HR, Marketing, IT, Project, Meeting, Action Required, FYI, External]
- action_items: array of objects with { task: string, due_date: string|null }
- meeting_request: object|null with { date: string, time: string, title: string } 
- quick_reply_draft: string|null (only if email clearly warrants a simple reply, otherwise null)

Return only valid JSON. No other text.`;
```

One API call, four features enriched, results stored once. That's the most cost-effective pattern for your background processing pipeline.
**We should never be causing infinite loops or re-fetching to avoid hitting rate limits and unneccessary expenses**
