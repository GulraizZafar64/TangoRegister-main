# Vercel Deployment Guide

This guide will help you deploy the TangoRegister application to Vercel and troubleshoot common issues, especially the "admin verification failed" error.

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. A Supabase project with database and authentication configured
3. All environment variables ready (see below)

## Architecture Overview

The repository now contains **two deployable applications**:

- `client/` – the Vite/React frontend that builds to static assets served by a CDN.
- `server-app/` – the standalone Express API that talks to Supabase and Stripe.

Deploy each one as its own Vercel project (or host the server elsewhere) so they can scale independently. The frontend talks to the server via `VITE_API_URL`.

## Step 1: Prepare Your Repository

Ensure your code is pushed to a Git repository (GitHub, GitLab, or Bitbucket). Vercel will connect to this repository for deployments.

## Step 2: Set Up Environment Variables in Vercel

Create **two** environment variable sets—one for the frontend project and one for the server API.

### Frontend (`client/`) Variables

Add these under Project Settings → Environment Variables:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_URL=https://your-api-project.vercel.app   # URL of the server deployment
```

`VITE_API_URL` can be omitted for local dev (the app will fall back to same-origin `/api` routes), but it **must** be set in production once the server is deployed separately.

### Server (`server-app/`) Variables

Set the secure variables for the API project:

#### Supabase Configuration
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Database Connection
```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.your-project.supabase.co:5432/postgres
```

#### Stripe Configuration
```
STRIPE_SECRET_KEY=sk_live_... or sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_live_... or pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... (if using webhooks)
```

#### SendGrid Configuration
```
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

#### Environment
```
NODE_ENV=production
```

### Where to Get These Values

1. **Supabase Variables**: 
   - Go to Supabase Dashboard → Settings → API
   - Copy Project URL, anon public key, and service_role key

2. **Database URL**:
   - Go to Supabase Dashboard → Settings → Database
   - Copy Connection string (URI format)
   - Replace `[YOUR-PASSWORD]` with your actual database password

3. **Stripe Keys**: 
   - From your Stripe Dashboard → Developers → API keys

4. **SendGrid**: 
   - From your SendGrid account → Settings → API Keys

## Step 3: Deploy to Vercel

Create **two** Vercel projects (or monorepo targets) pointing to each workspace.

### Project A – Client (Static Site)
1. Go to https://vercel.com/new and import the repo.
2. When prompted for **Root Directory**, choose `client/`.
3. Build command: `npm run build`
4. Output directory: `dist/public`
5. Add the frontend environment variables from Step 2.
6. Deploy.

The root-level `vercel.json` mirrors this configuration, so deploying from the repo root also works if you prefer not to set a custom root directory.

### Project B – Server API
1. Create another Vercel project pointing to the `server-app/` directory.
2. Build command: `npm run build`
3. Output is handled by `server-app/vercel.json`, which wires `/dist/vercel-handler.cjs` as the entry point.
4. Add the server environment variables from Step 2 (Supabase, Stripe, etc).
5. Deploy.

Once both deployments are live, update the frontend project's `VITE_API_URL` to the URL of the server project and trigger a redeploy.

### Optional: Deploy via Vercel CLI

```bash
npm i -g vercel
vercel login

# Deploy client
cd client
vercel --prod

# Deploy server
cd ../server-app
vercel --prod
```

## Step 4: Verify Deployment

After deployment, test the following:

1. **Frontend loads**: Visit your Vercel URL
2. **Public API works**: Call the server project directly (e.g. `https://your-api-project.vercel.app/api/events/current`)
3. **Admin login**: Try logging in at `/admin-login`
4. **Admin verification**: After login, verify you can access admin routes

## Troubleshooting

### Issue: "Admin verification failed" Error

This is the most common issue. Here's how to fix it:

#### 1. Check Environment Variables

Verify these are set correctly in Vercel:
- `SUPABASE_SERVICE_ROLE_KEY` - Must be the service_role key, NOT the anon key
- `SUPABASE_URL` - Must match your Supabase project URL
- `DATABASE_URL` - Must be correct and accessible

#### 2. Verify Admin User Exists

1. Connect to your Supabase database
2. Check the `adminUsers` table:
   ```sql
   SELECT * FROM "adminUsers" WHERE "isActive" = true;
   ```
3. Ensure your login email matches exactly (case-sensitive in some cases)

#### 3. Check Supabase Auth User

1. Go to Supabase Dashboard → Authentication → Users
2. Verify the user exists and is confirmed
3. The email in Supabase Auth must match the email in `adminUsers` table

#### 4. Check Server Logs

1. Go to Vercel Dashboard → Your Project → Functions
2. Click on the function that failed
3. Check the logs for detailed error messages
4. Look for:
   - Database connection errors
   - Supabase authentication errors
   - Email mismatch errors

#### 5. Test Database Connection

The database connection might be failing. Check:
- `DATABASE_URL` format is correct
- Database password is correct
- Supabase allows connections from Vercel (should be enabled by default)

#### 6. Verify Token Flow

1. Check browser console for network errors
2. Verify the token is being sent in Authorization header
3. Check if token is valid (not expired)

### Issue: API Requests Return 404

1. Confirm the server project deployed (check Functions logs in the API project).
2. Verify `server-app/vercel.json` is present and `npm run build` produces `dist/vercel-handler.cjs`.
3. Make sure the frontend `VITE_API_URL` points to the live server URL and redeploy the client when you change it.
4. Hit the API project directly (e.g. `https://your-api-project.vercel.app/api/events/current`) to ensure the route exists before testing from the frontend.

### Issue: Database Connection Errors

1. Verify `DATABASE_URL` is correct
2. Check Supabase connection pooling settings
3. Ensure database is not paused (Supabase free tier pauses after inactivity)
4. Check connection limits (serverless functions use `max: 1` connection)

### Issue: Build Fails

1. Check build logs in Vercel dashboard
2. Verify all dependencies are listed in the relevant workspace `package.json`
3. Check for TypeScript errors: `npm run lint:client` and `npm run check:server`
4. Ensure build scripts work locally: `npm run build:client` and `npm run build:server`

### Issue: Frontend Assets Not Loading

1. Verify `dist/public` directory exists after build
2. Check `vercel.json` outputDirectory is correct
3. Ensure static files are being served correctly

## Environment Variable Checklist

Before deploying, verify you have set:

- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `DATABASE_URL`
- [ ] `VITE_SUPABASE_URL` (same as SUPABASE_URL)
- [ ] `VITE_SUPABASE_ANON_KEY` (same as SUPABASE_ANON_KEY)
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_PUBLISHABLE_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET` (if using webhooks)
- [ ] `SENDGRID_API_KEY`
- [ ] `SENDGRID_FROM_EMAIL`
- [ ] `NODE_ENV=production`

## Testing Admin Login After Deployment

1. Navigate to `https://your-app.vercel.app/admin-login`
2. Enter your admin email and password
3. Check browser console for errors
4. Check Vercel function logs if login fails
5. Verify the admin user exists in both:
   - Supabase Authentication (Auth → Users)
   - Database `adminUsers` table (with `isActive = true`)

## Additional Notes

- **Cold Starts**: First request after inactivity may be slower (serverless cold start)
- **Function Timeout**: Default is 10 seconds, can be increased in Vercel settings
- **Database Connections**: Serverless functions use connection pooling with `max: 1`
- **Environment Variables**: Changes require a new deployment to take effect

## Getting Help

If you continue to experience issues:

1. Check Vercel function logs for detailed error messages
2. Check browser console for client-side errors
3. Verify all environment variables are set correctly
4. Test database connection separately
5. Test Supabase authentication separately

## Local Testing

Before deploying, test locally with production-like environment:

```bash
# Set environment variables
export NODE_ENV=production
export SUPABASE_URL=...
# ... set all other variables

# Build both workspaces
npm run build:client
npm run build:server

# Test the API build
npm run start:server

# Serve the static client (optional)
npx serve dist/public
```

Then test admin login locally to ensure it works before deploying.

