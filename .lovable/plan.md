

# Review Autopilot — Frontend MVP

## Overview
A polished, functional frontend for an AI-powered review management platform targeting single restaurant owners. Uses simulated/demo data with realistic AI response templates. GBP OAuth flow scaffolded for future integration.

---

## Pages & Features

### 1. Dashboard (Home)
- **Stats cards**: Total reviews, avg rating, response rate, pending responses
- **Rating trend chart** (last 30 days, simulated data)
- **Recent reviews feed** with sentiment badges (positive/neutral/negative)
- **Quick action: "Reviews needing response"** count with link

### 2. Reviews Page
- **Review list** with filters: platform (Google/TripAdvisor), rating (1-5), sentiment, status (pending/approved/posted)
- **Each review card shows**: Author, rating (stars), date, review text, sentiment tag, topic tags (food/service/ambience/etc.), priority indicator
- **Click to open review detail** with AI-generated response panel

### 3. Review Detail & Response Approval
- Full review text with metadata
- **AI-generated response** (simulated) with confidence score badge
- **Evaluator scores** displayed (brand voice, specificity, safety, length — per PRD Section 4.2)
- **Actions**: Approve, Edit & Approve, Reject, Regenerate
- Edit mode with rich text area
- Response history/audit trail

### 4. Brand Voice Setup
- **Tone configuration**: Sliders for Formal↔Casual, Playful↔Serious, Brief↔Detailed
- **Persona prompt** text area
- **Sample responses** — add 3-5 example responses the AI should learn from
- **Keywords** to always include/avoid
- **Preview**: Show how a sample response would look with current settings

### 5. Insights Dashboard
- **Complaint velocity alerts** (simulated: "Slow service mentioned 5x this week")
- **Top complaint topics** bar chart
- **Sentiment breakdown** pie/donut chart
- **Response impact score** (simulated rating changes)
- **Best-performing responses** list
- Each insight has an **actionable recommendation**

### 6. Settings
- **Location profile**: Name, address, cuisine type, platform connections status
- **Automation mode selector**: Full Approval / Smart Semi-Auto / Full Auto (with descriptions from PRD)
- **GBP Connection panel**: "Connect Google Business Profile" button (scaffolded OAuth flow — shows steps needed, stores no real tokens)
- **Notification preferences**

### 7. Backfill Queue (simplified)
- List of historical unresponded reviews grouped by priority tier (per PRD Section 5.1)
- Priority badges: CRITICAL / HIGH / MEDIUM / LOW
- Batch approve controls
- Anti-spam status indicator showing daily posting limits

---

## Design System
- **Clean SaaS dashboard** aesthetic — light theme, professional
- **Color palette**: Primary blue (#2563EB), success green, warning amber, destructive red for sentiment
- **Sidebar navigation** with icons
- Fully responsive (mobile-first given 432px viewport)
- shadcn/ui components throughout

## Data Layer
- All demo data via TypeScript constants/mock files
- ~50 sample reviews across ratings 1-5 with realistic restaurant review text
- ~30 simulated AI responses with varying confidence scores
- Insights data covering 30-day trends

## Tech Approach
- React + TypeScript + Tailwind + shadcn/ui
- React Router for page navigation
- Recharts for dashboard charts
- No backend needed — all client-side with mock data
- GBP OAuth flow UI scaffolded (connect button, status indicators, settings panel)

