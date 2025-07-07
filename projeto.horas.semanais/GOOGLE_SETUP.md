# Google OAuth Setup for Deo Cave

This guide will help you set up Google OAuth authentication in your Supabase project.

## Step 1: Configure Google OAuth in Supabase

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Providers**
3. Find **Google** in the list and click **Enable**
4. You'll need to configure the Google OAuth credentials

## Step 2: Create Google OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API** (if not already enabled)
4. Go to **Credentials** > **Create Credentials** > **OAuth 2.0 Client IDs**
5. Choose **Web application** as the application type
6. Add your authorized redirect URIs:
   - For development: `http://localhost:3000`
   - For production: `https://your-domain.com`
7. Copy the **Client ID** and **Client Secret**

## Step 3: Configure Supabase with Google Credentials

1. In your Supabase dashboard, go to **Authentication** > **Providers** > **Google**
2. Enter your Google **Client ID** and **Client Secret**
3. Save the configuration

## Step 4: Set up Database Tables

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase-setup-safe.sql` into the editor
4. Run the SQL script to create the necessary tables and policies
5. **Note**: This script is safe to run and won't conflict with your existing database structure

## Step 5: Environment Variables

Make sure your `.env` file contains the correct Supabase credentials:

```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Step 6: Test the Setup

1. Start your React app: `npm start`
2. You should see a login page with a Google sign-in button
3. Click the Google button to test the authentication flow
4. After successful login, you should be redirected to the main application

## Features

- ✅ Google OAuth authentication
- ✅ User data synchronization across devices
- ✅ Row Level Security (RLS) policies
- ✅ Automatic user settings creation
- ✅ Real-time data updates
- ✅ Responsive design

## Database Schema

### user_settings
- `id`: Primary key
- `user_id`: UUID (from Supabase auth)
- `total_weekly_hours`: Integer (default: 40)
- `created_at`: Timestamp
- `updated_at`: Timestamp

### tasks
- `id`: Primary key
- `user_id`: UUID (from Supabase auth)
- `name`: String (task name)
- `duration`: Decimal (hours)
- `color`: String (hex color)
- `description`: Text (optional)
- `created_at`: Timestamp
- `updated_at`: Timestamp

## Security Features

- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Automatic user settings creation on signup
- Secure authentication flow with Google OAuth

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI" error**
   - Make sure your redirect URI in Google Cloud Console matches your app URL
   - For development, use `http://localhost:3000`

2. **"Client ID not found" error**
   - Verify your Google Client ID is correct in Supabase
   - Make sure Google OAuth is enabled in Supabase

3. **Database connection errors**
   - Check your Supabase URL and anon key in `.env`
   - Ensure the SQL setup script has been run

4. **RLS policy errors**
   - Make sure Row Level Security is enabled on tables
   - Verify the RLS policies are correctly applied

### Getting Help

If you encounter issues:
1. Check the browser console for error messages
2. Verify your Supabase project settings
3. Ensure all environment variables are set correctly
4. Check that the database tables and policies are created properly 