# Block Wars - Real-Time Shared Grid

A real-time, multiplayer interactive grid application built with Next.js and Supabase. Think of it as a shared board where anyone who connects can instantly start claiming territory in real-time, competing with others around the world.

## ✨ Key Features

- **Real-Time Multiplayer Sync**: Instantly see blocks being claimed by other users without having to refresh the page. Powered by Supabase Realtime WebSockets.
- **Block Capture Mechanics**: Click on any block (unclaimed or previously owned by someone else) to capture it. The block will immediately display your unique player ID and assigned color.
- **Live Leaderboard**: A real-time updating ranking panel that tracks the top 5 players based on the number of blocks they currently control.
- **Action Cooldowns**: To keep things fair, there is a built-in 2-second cooldown after every block capture, complete with a visual "RECHARGING..." overlay.
- **Optimistic UI Updates**: Immediate visual feedback! When you click a block, it visually indicates that it is being claimed while the database request resolves in the background.
- **Persistent Player Identities**: Your auto-generated player ID and uniquely assigned color are saved in your browser's local storage, ensuring you don't lose your identity if you reload the page.
- **Neobrutalist Design Aesthetic**: A raw, bold, and trendy visual design featuring sharp edges, distinct borders, and vibrant orange color palettes.

## 🛠️ Tech Stack

- **Frontend Framework**: Next.js (React)
- **Language**: TypeScript
- **Backend & Database**: Supabase (PostgreSQL)
- **Real-time Layer**: Supabase Realtime (WebSockets)
- **Styling**: Vanilla CSS (Neobrutalism UI implementation)

## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js installed on your machine. You will also need a Supabase project set up.

### Installation

1. Clone the repository and navigate into the project directory:
```bash
git clone <your-repo-url>
cd inboxkit
```

2. Install dependencies:
```bash
npm install
```

3. Set up your environment variables by creating a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up the Supabase database:
You will need a `blocks` table in your public schema with the following structure:
- `id` (text, primary key) - formatted as `x-y` coordinates
- `owner` (text) - the user ID
- `color` (text) - the user's assigned hex color

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser. Open multiple windows or devices to see the real-time syncing in action!

## 💡 System Design Notes

- The grid relies heavily on a centralized PostgreSQL table managed by Supabase.
- WebSockets are used to listen to `postgres_changes`, ensuring clients are always in sync with the source of truth without polling.
- The UI handles race conditions gracefully by relying on the server's final state while using optimistic state updates for a snappy feel.
