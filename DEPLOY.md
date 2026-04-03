# Deployment Guide

**Frontend** → Netlify (free)  
**Backend** → Render (free)  
**Database** → Supabase (already live, nothing to do)

---

## Before you start

You need two accounts:
- [netlify.com](https://netlify.com) — sign up free
- [render.com](https://render.com) — sign up free

Your code must be in a GitHub repository. If it isn't yet:
1. Go to [github.com](https://github.com) and create a new repository
2. Push this project to it:
   ```bash
   cd revaut
   git init
   git add .
   git commit -m "initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

---

## Step 1 — Deploy the backend to Render

The backend is the Express server in the `server/` folder. It handles AI calls and keeps your Gemini API key secret.

1. Log in to [render.com](https://render.com)
2. Click **New +** → **Web Service**
3. Click **Connect a repository** → select your GitHub repo
4. Fill in the settings:
   | Field | Value |
   |---|---|
   | Name | `revaut-api` |
   | Root Directory | `server` |
   | Runtime | `Node` |
   | Build Command | `npm install` |
   | Start Command | `npm start` |
   | Instance Type | Free |
5. Click **Add Environment Variables** and add these four:

   | Key | Value |
   |---|---|
   | `GEMINI_API_KEY` | Your Gemini API key |
   | `SUPABASE_URL` | `https://wywtnbbgikiztjretkrd.supabase.co` |
   | `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key (from Supabase dashboard → Project Settings → API) |
   | `CORS_ORIGIN` | Leave blank for now — you'll fill this in after Step 2 |

6. Click **Deploy Web Service**
7. Wait for the build to finish (2–3 minutes). When it shows **Live**, copy the URL — it looks like `https://revaut-api.onrender.com`

> **Test it:** Open `https://revaut-api.onrender.com/api/health` in your browser. You should see `{"status":"ok"}`.

---

## Step 2 — Deploy the frontend to Netlify

The frontend is the React app. Netlify builds it and serves it as a static site.

1. Log in to [netlify.com](https://netlify.com)
2. Click **Add new site** → **Import an existing project** → **Deploy with GitHub**
3. Select your GitHub repo
4. Netlify detects the settings automatically from `netlify.toml` — you don't need to change them:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Click **Add environment variables** and add these:

   | Key | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | `https://wywtnbbgikiztjretkrd.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5d3RuYmJnaWtpenRqcmV0a3JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMjQ5NjUsImV4cCI6MjA5MDgwMDk2NX0.U_2rieIA3MNMvyQksTiiV0fZ3RVZAHtc9q-bg7A9BGA` |
   | `VITE_API_URL` | Paste your Render URL from Step 1 + `/api` — e.g. `https://revaut-api.onrender.com/api` |

6. Click **Deploy site**
7. Wait for the build (1–2 minutes). When done, Netlify gives you a URL like `https://revaut-abc123.netlify.app`

> **Test it:** Open the Netlify URL in your browser. You should see the RevAut login page.

---

## Step 3 — Connect them (update CORS)

Now that both services are live, tell the backend to accept requests from your Netlify URL.

1. Go back to [render.com](https://render.com) → your `revaut-api` service
2. Click **Environment** in the left sidebar
3. Find `CORS_ORIGIN` and set it to your Netlify URL (e.g. `https://revaut-abc123.netlify.app`)
4. Click **Save Changes** — Render redeploys automatically (takes ~1 minute)

---

## Step 4 — Verify everything works

1. Open your Netlify URL
2. Log in with your Supabase credentials
3. Open a review and click **Generate Response** — this calls the backend, which calls Gemini
4. If the response appears, everything is connected correctly

---

## Troubleshooting

**"Network error" or "Failed to fetch" when generating a response**
- Check that `VITE_API_URL` in Netlify matches your Render URL exactly (no trailing slash)
- Check that `CORS_ORIGIN` in Render matches your Netlify URL exactly

**Render service sleeps after 15 minutes of inactivity (free tier)**
- The first request after sleep takes ~30 seconds to wake up — this is normal on the free tier
- Upgrade to a paid Render plan ($7/month) to keep it always-on

**Build fails on Netlify**
- Go to Netlify → your site → **Deploys** → click the failed deploy to see the error log
- Most common cause: a missing environment variable

**Supabase login doesn't work**
- Go to your Supabase dashboard → **Authentication** → **URL Configuration**
- Add your Netlify URL to the **Site URL** and **Redirect URLs** fields
