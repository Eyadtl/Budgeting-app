# Zero-Based Monthly Budgeting App

A mobile-first budgeting application built with React (Vite), Tailwind CSS, and Supabase.

## Tech Stack

- **Frontend**: React + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **State Management**: Zustand
- **Icons**: Lucide React
- **Routing**: React Router DOM

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```

3. Add your Supabase credentials to `.env`:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Set up the database:
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Copy and run the contents of `supabase/schema.sql`

5. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
src/
├── components/           # Reusable UI components
│   └── ui/              # Base UI elements
├── pages/               # Page-level components
│   ├── Auth/            # Login/Register
│   └── Dashboard/       # Main dashboard
├── services/            # External service integrations
│   └── supabase/        # Supabase client & auth
├── stores/              # Zustand state management
├── hooks/               # Custom React hooks
├── types/               # Type definitions
└── utils/               # Utility functions
```

## Database Schema

- **profiles**: User preferences and settings
- **income_sources**: Income entries (salary, freelance, etc.)
- **categories**: Budget categories with limits
- **expenses**: Individual expense entries
- **debts**: Debt tracking with payments

All tables have Row Level Security (RLS) enabled for user-level access control.

## License

MIT
