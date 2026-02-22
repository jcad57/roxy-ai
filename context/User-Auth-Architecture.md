**DO NOT MAKE ANY CHANGES TO THIS FILE**

# User Authentication and connection to email client

This file will provide concise steps for new user sign up and authentication with our app as well as connecting their email client to this app. Always follow these steps when implementing features related to authentication.

**Supabase Reference Links:**
https://supabase.com/docs/guides/auth
https://supabase.com/docs/guides/auth/social-login/auth-azure
https://supabase.com/docs/guides/auth/social-login/auth-google

## Initial user sign up flow

When a user signs up as a new user, follow these steps. Ensure this process is efficient, robust and secure. Follow security best practices for sensitive user data and email data. Avoid multiple fetch or API calls unless absolutely neccessary. Minimize unneccessary UI re-renders and flickering.

1. When a user signs up, we will use OAuth for Google and Microsoft (Azure) since that will streamline the connection process between their RoxyAI account and their email client account.
2. User will follow the OAuth flow (see the reference links above for proper implementation of these services from Supabase). Provide detailed supabase steps for setting up this flow in supabase.
3. If errors persist, route to an error page that elegantly explains to the user what went wrong and how to resolve.
4. On success, we now want to link up to their email client and fetch their emails. For now, do not implement this feature with Google Gmail, let's only focus on Outlook.
5. The process should remain **in-browser** when we migrate the user to Outlook to sign in and authorize our app to access email data.
6. If errors occur, ensure we are properly routing and displaying errors to the user to understand what went wrong.
7. On success, route the user to the dashboard. Ensure all sessions and tokens are being stored properly and tracked.
8. Fetch emails based on context/Email-Fetching-Architecuture.md under the **Initial fetching for new users** section.
