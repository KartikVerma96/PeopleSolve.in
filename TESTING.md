# PeopleSolve — Feature Testing Guide

## Setup

### Prerequisites
- Node.js 18+
- MySQL running locally
- Backend `.env` configured (see `backend/.env.example`)

### Start the app
```bash
# Terminal 1: Backend
cd backend
npm install
npx prisma db push
npx prisma generate
npx tsx prisma/seed.ts   # seed demo data
npm run dev              # http://localhost:4000

# Terminal 2: Frontend
cd frontend
npm install
npm run dev              # http://localhost:3000
```

### Test accounts
- **Demo account**: `demo@peoplesolve.dev` / `demo`
- **Guest**: Click "Continue as guest" (no account needed)
- **Create new accounts**: Register via /register page

---

## 1. Authentication

### 1.1 Guest Sign-in
- [ ] Click "Continue as guest" on sidebar or login page
- [ ] Should redirect to home feed
- [ ] Sidebar shows "Guest" with "Guest session" label
- [ ] Guest can browse feed, view doubts, but cannot help or post

### 1.2 Email/Password Registration
- [ ] Go to /register
- [ ] Fill name (min 2 chars), email, password (min 8 chars), confirm password
- [ ] Submit → redirects to /login?registered=1 with success banner
- [ ] Sign in with the new credentials

### 1.3 Email/Password Login
- [ ] Go to /login
- [ ] Use demo@peoplesolve.dev / demo (works even without backend running)
- [ ] Should redirect to home feed after login

### 1.4 Google Sign-in (if configured)
- [ ] Set `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` in `frontend/.env.local`
- [ ] Google button appears on login page
- [ ] Click → OAuth flow → redirect back signed in

### 1.5 Sign Out
- [ ] Click "Sign out" in sidebar
- [ ] Redirects to home page, sidebar shows sign in buttons

---

## 2. Live Feed (Home Page)

### 2.1 Feed Loading
- [ ] Home page shows hero banner with "Post your doubt" and "Browse doubts" buttons
- [ ] Feed loads doubts from API (or shows "Could not load doubts" if backend is down)
- [ ] "Refresh" button reloads the feed

### 2.2 Search
- [ ] Search bar above feed filters doubts in real-time
- [ ] Cmd+K / Ctrl+K focuses the search input
- [ ] Clear (X) button resets search
- [ ] "8 active" badge updates count based on filter

### 2.3 Keyboard Navigation
- [ ] Press `j` to move focus down, `k` to move up
- [ ] Focused card has green border highlight
- [ ] Press `Enter` to open doubt detail page

### 2.4 Doubt Cards
- [ ] Each card shows: exam badge, subject badge, title, preview, author, time, viewers, helpers
- [ ] Urgent doubts show pulsing amber "Urgent" badge
- [ ] Resolved doubts show green "Solved" badge with reduced opacity
- [ ] "Help Now" button (green shiny) links to /doubt/[id]
- [ ] Share button opens WhatsApp/Telegram/Copy menu
- [ ] Title is clickable → links to doubt detail

### 2.5 Real-time Updates (requires 2 browsers)
- [ ] Open feed in 2 browsers (signed in as different users)
- [ ] Post a doubt from one → it appears in the other's feed instantly
- [ ] Online count updates in feed header

---

## 3. Post a Doubt

### 3.1 Form
- [ ] Go to /post (or click "Post your doubt" button)
- [ ] Select exam category (SSC, Bank, Railway, IIT-JEE, NEET, UPSC, GATE, CAT, CLAT, etc.)
- [ ] Exams dropdown shows category-specific exams (e.g., SSC → SSC CGL, CHSL, MTS...)
- [ ] Subject dropdown updates per-exam (e.g., SSC CGL → Quant, Reasoning, English, GA, Stats...)
- [ ] Type question (required, max 120 chars), character counter shown
- [ ] Type details (optional, max 1000 chars), character counter shown
- [ ] Drag & drop or click to upload image (JPEG/PNG/GIF/WebP, max 5MB)
- [ ] Toggle "Mark as urgent"
- [ ] Submit button disabled when question is empty

### 3.2 Submit
- [ ] Click "Post doubt" → submits to API → redirects to home feed
- [ ] New doubt appears at top of feed
- [ ] If backend is down, doubt saved locally (fallback)

---

## 4. Doubt Detail Page (/doubt/[id])

### 4.1 View
- [ ] Click any doubt title or "Help Now" → opens detail page
- [ ] Shows: exam, subject, urgent/resolved badges, full title, full description
- [ ] Author info: avatar, name, karma, time posted, view count, helper count
- [ ] Image displayed if attached
- [ ] "Back to feed" link at top
- [ ] Thread count shown at bottom if helpers engaged

### 4.2 Actions
- **Not signed in**: Shows "Sign in to help" button
- **Own doubt**: Shows "This is your doubt" with link to messages
- **Signed in (other user)**: Shows "Start helping" green button
- **Resolved**: Shows "This doubt has been resolved" banner
- [ ] Click "Start helping" → creates thread → redirects to /messages?thread=X

---

## 5. Messages & Chat

### 5.1 Thread List
- [ ] Go to /messages
- [ ] Shows list of conversation threads (sorted by most recent)
- [ ] Each thread shows: doubt title, other person's avatar, last message preview, time
- [ ] Click a thread → opens chat view

### 5.2 Chat
- [ ] Messages load for the selected thread
- [ ] Type and send messages (Enter or click send button)
- [ ] Messages appear in real-time on both sides (Socket.io)
- [ ] Typing indicator shows "X is typing..."
- [ ] Auto-scrolls to newest message
- [ ] Back button returns to thread list

### 5.3 Chat Header Actions
- [ ] Phone icon → starts voice call
- [ ] Video icon → starts video call
- [ ] Coffee icon → opens "Buy me a Coffee" tip modal
- [ ] Resolve button (for doubt author only) → marks doubt as resolved

### 5.4 Notification Badge
- [ ] When a new message arrives and you're NOT on /messages, sidebar "Messages" icon shows red badge with count
- [ ] Clicking Messages clears the badge

---

## 6. Voice & Video Calling

### 6.1 Initiating a Call
- [ ] Open a chat thread
- [ ] Click phone icon (voice) or video icon (video)
- [ ] Full-screen call overlay appears with "Calling..." and avatar animation
- [ ] Other person sees incoming call notification

### 6.2 Receiving a Call
- **On messages page**: Full-screen overlay with accept/reject buttons
- **On any other page**: Top banner slides down with caller info + accept/reject
- [ ] Accept → call connects
- [ ] Reject → caller sees "Call rejected"

### 6.3 In-Call Controls
- [ ] Mute/unmute mic
- [ ] Toggle camera on/off (video calls)
- [ ] Share screen (replaces video track)
- [ ] End call (red button)
- [ ] Other person's video/audio plays correctly

### 6.4 Video Call
- [ ] Remote video shows full-screen
- [ ] Local video shows in bottom-right picture-in-picture
- [ ] Camera toggle shows/hides local video

### 6.5 End Call
- [ ] Either side can end the call
- [ ] Both sides return to idle state
- [ ] Media tracks properly stopped (no lingering camera/mic access)

---

## 7. Buy me a Coffee (Payments)

> Requires Razorpay test keys in `backend/.env`:
> `RAZORPAY_KEY_ID=rzp_test_xxx`
> `RAZORPAY_KEY_SECRET=xxx`
> Get free test keys at https://dashboard.razorpay.com/app/keys

### 7.1 Tip Modal
- [ ] Click coffee icon in chat header → tip modal opens
- [ ] Shows helper's name, preset amounts (₹10, ₹25, ₹50, ₹100, ₹250, ₹500)
- [ ] Click "Custom" to enter a custom amount
- [ ] Fee breakdown shown: amount, 10% platform fee, helper gets
- [ ] Thank you note field (optional)
- [ ] "Pay ₹X" shiny button

### 7.2 Payment Flow
- [ ] Click Pay → Razorpay checkout opens (test mode)
- [ ] Complete test payment (use test card 4111 1111 1111 1111, any expiry/CVV)
- [ ] Success animation with heart icon
- [ ] Payment recorded in database
- [ ] Helper receives karma bonus

### 7.3 Profile UPI
- [ ] Go to /profile
- [ ] "Buy me a Coffee" section shows UPI ID editor
- [ ] Click "Edit" → enter UPI ID → Save

---

## 8. Explore Page (/explore)

- [ ] Sidebar "Explore" icon → /explore page
- [ ] Search bar filters doubts by keyword
- [ ] Exam category pills filter by specific exams
- [ ] Results show doubt cards with exam, subject, title, preview
- [ ] Click any doubt → opens detail page
- [ ] Urgent and resolved badges shown

---

## 9. Leaderboard (/leaderboard)

- [ ] Sidebar "Leaderboard" icon → /leaderboard page
- [ ] Shows top helpers ranked by karma
- [ ] Exam filter pills (All, SSC CGL, IBPS PO, JEE Main, etc.)
- [ ] Top 3 have trophy/medal icons
- [ ] Each entry shows: rank, avatar, name, verified badge, answer count, tips, karma
- [ ] Verified users show shield icon

---

## 10. Share Functionality

### 10.1 Doubt Card Share
- [ ] Click share icon on any doubt card
- [ ] On mobile: native share sheet (if supported)
- [ ] On desktop: dropdown with WhatsApp, Telegram, Copy link options
- [ ] WhatsApp link opens wa.me with pre-filled message
- [ ] Telegram link opens t.me/share
- [ ] Copy link copies doubt URL to clipboard

---

## 11. Referral System

> Backend routes: POST /referrals/generate, POST /referrals/apply, GET /referrals/stats

### 11.1 Generate Code
- [ ] POST /referrals/generate with userId → returns unique 8-char code
- [ ] Same user gets same code on repeat calls

### 11.2 Apply Code
- [ ] POST /referrals/apply with userId + code → awards 5 karma to both
- [ ] Cannot refer yourself
- [ ] Cannot apply code twice

### 11.3 Stats
- [ ] GET /referrals/stats?userId= → shows code, total referred, karma earned

---

## 12. Answer System

> Backend routes: POST /answers, GET /answers?doubtId=, POST /answers/:id/vote, POST /answers/:id/rate

### 12.1 Post Answer
- [ ] POST /answers with doubtId, authorId, body → creates answer
- [ ] Awards 2 karma to the answerer

### 12.2 Vote
- [ ] POST /answers/:id/vote with userId, value (1/-1/0) → upvote/downvote/remove
- [ ] Returns updated vote counts

### 12.3 Rate
- [ ] POST /answers/:id/rate with raterId, rating (1-5) → rate an answer
- [ ] 4-star rating awards 1 bonus karma, 5-star awards 3
- [ ] Returns average rating

---

## 13. Daily Challenge

> Backend routes: GET /challenges/today?exam=, POST /challenges

### 13.1 Create (Admin)
- [ ] POST /challenges with exam, subject, title, description, answer, publishDate

### 13.2 View
- [ ] GET /challenges/today → returns today's challenges per exam
- [ ] Answer only revealed after the day ends

---

## 14. Report System

> Backend route: POST /reports

- [ ] POST /reports with reporterId, targetType (doubt/answer/message/user), targetId, reason
- [ ] Creates report with "pending" status

---

## 15. PWA (Progressive Web App)

- [ ] Open app in Chrome on mobile
- [ ] "Add to home screen" prompt should appear (or available via browser menu)
- [ ] App opens in standalone mode (no browser chrome)
- [ ] Theme color is #32cd32 (green status bar)

---

## 16. Theme & UI

### 16.1 Dark/Light Mode
- [ ] Toggle theme with sun/moon icon (top-right desktop, header on mobile)
- [ ] All components render correctly in both modes
- [ ] Cards, badges, buttons have proper contrast

### 16.2 Mobile Responsive
- [ ] Sidebar collapses to sheet menu on mobile
- [ ] Feed, detail page, messages all work on narrow screens
- [ ] Touch-friendly button sizes

### 16.3 Brand Elements
- [ ] Logo: "People" (green) + "solve" (dark) + "." (red) — sidebar, mobile header
- [ ] Loading states show branded logo loader (text fills with color)
- [ ] Shiny green gradient buttons with sweep animation on hover
- [ ] Urgent badges have pulsing glow + flame wiggle animation
- [ ] Sidebar active item has sliding green pill with spring animation

### 16.4 Fonts
- [ ] Headings use **Plus Jakarta Sans** (bold, geometric)
- [ ] Body text uses **DM Sans** (friendly, rounded)

---

## 17. Google Sign-in (Optional Setup)

1. Create a project at https://console.cloud.google.com
2. Enable Google OAuth consent screen
3. Create OAuth 2.0 credentials (Web application)
4. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
5. Add to `frontend/.env.local`:
   ```
   AUTH_GOOGLE_ID=your-client-id
   AUTH_GOOGLE_SECRET=your-client-secret
   ```
6. Restart frontend → Google button appears on login page

---

## 18. Razorpay Setup (For Payments)

1. Sign up at https://dashboard.razorpay.com
2. Go to Settings → API Keys → Generate test key
3. Add to `backend/.env`:
   ```
   RAZORPAY_KEY_ID=rzp_test_xxxxxx
   RAZORPAY_KEY_SECRET=xxxxxx
   ```
4. Restart backend → payments work in test mode
5. Test card: 4111 1111 1111 1111, any future expiry, any CVV

---

## Quick Smoke Test (5 minutes)

1. Start backend + frontend
2. Open http://localhost:3000 in 2 browsers (Chrome + Incognito)
3. Register user A in Chrome, user B in Incognito
4. User A: Post a doubt (SSC CGL → Reasoning → "How to solve seating arrangement?")
5. User B: See doubt in feed → click "Help Now" → read detail → click "Start helping"
6. Both: Chat in the thread — send messages back and forth
7. User B: Click phone icon → User A sees incoming call → accept → voice works
8. User A: Click coffee icon → tip ₹50 (if Razorpay configured)
9. User A: Click "Resolve" → doubt shows as solved in feed
10. Check /leaderboard → both users should appear with karma
