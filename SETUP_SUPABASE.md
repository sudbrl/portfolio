# NEPSE Pro - Supabase Setup Instructions

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in:
   - **Name**: nepse-pro (or your choice)
   - **Database Password**: Choose a strong password (save it securely)
   - **Region**: Choose closest to your users
4. Click "Create new project" and wait for setup to complete

## Step 2: Get Your Supabase Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these two values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

## Step 3: Update app.js with Your Credentials

Open `/workspace/app.js` and replace lines 2-3:

```javascript
const SUPABASE_URL = "YOUR_SUPABASE_URL";  // Paste your Project URL here
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";  // Paste your anon key here
```

Example:
```javascript
const SUPABASE_URL = "https://abcdefghij.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
```

## Step 4: Set Up Database Table

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire content of `/workspace/supabase-migration.sql`
4. Paste it into the SQL editor
5. Click "Run" to execute

This creates:
- A `portfolio` table with proper structure
- Row Level Security (RLS) policies so users can only access their own data
- Automatic timestamp updates

## Step 5: Configure Authentication

1. Go to **Authentication** → **Providers** in Supabase
2. Ensure **Email** provider is enabled
3. (Optional) Configure email templates under **Authentication** → **Email Templates**
4. For production, configure custom SMTP or use Supabase's email service

## Step 6: Deploy to Netlify

1. Push your code to GitHub/GitLab
2. Connect your repo to Netlify
3. The app will automatically deploy

## Security Features

✅ **Row Level Security (RLS)**: Users can ONLY access their own portfolio data
✅ **Password Requirements**: Minimum 6 characters (configurable in Supabase)
✅ **Email Confirmation**: Users must verify email before login
✅ **Secure Sessions**: Supabase handles JWT tokens securely
✅ **No Client-Side Secrets**: Only the public anon key is exposed (safe by design)

## Testing

1. Open your deployed site
2. Click "Don't have an account? Sign Up"
3. Enter email and password (min 6 chars)
4. Check your email for confirmation link
5. Click the confirmation link
6. Login with your credentials
7. Add stocks to your portfolio
8. Logout and login again - your data persists!
9. Try on different browsers/devices - data syncs automatically!

## Troubleshooting

### "Invalid API key" error
- Double-check you copied the **anon/public** key, not the service role key
- Ensure no extra spaces in the credentials

### "Relation 'public.portfolio' does not exist"
- Re-run the SQL migration in Supabase SQL Editor
- Check that the table exists under **Table Editor**

### Email not received
- Check spam folder
- In development, use `Confirm` option in Supabase dashboard under **Authentication** → **Users**
- For production, configure custom SMTP

### Data not saving
- Open browser console (F12) to see error messages
- Verify RLS policies are correctly set up
- Ensure user is authenticated (check `auth.uid()` matches `user_id`)
