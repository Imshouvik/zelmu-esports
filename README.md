# Zelmu Esports Platform

A modern, professional esports organization platform for mobile games like BGMI and Free Fire. Built with Next.js, TypeScript, Tailwind CSS, and Redux Toolkit.

## Features

- 🎮 **Tournament Management**
  - Create and manage tournaments with advanced options (rules, rewards, featured/upcoming, etc.)
  - Set prize pools and registration fees
  - Track team registrations
  - View tournament brackets and results

- 👥 **User & Club Management**
  - User registration and authentication (email/password, OAuth)
  - Team and club registration with player details
  - Profile management and completion
  - Club invites and join via invite code
  - **Real user avatars**: Dashboard now displays real user avatars from the database

- 🏆 **Tournament Features**
  - Tournament listings with filters
  - Detailed tournament pages
  - Registration system
  - Prize distribution tracking

- 🛡️ **Secure Admin Panel**
  - Role-based access control (superadmin, admin, user)
  - Manage users, clubs, tournaments, and permissions
  - Real-time permission updates (UI reflects backend state instantly)
  - Push notifications to all users (with automatic cleanup of invalid FCM tokens)
  - View platform stats (users, clubs, tournaments, active members)
  - Analytics and reporting

- 🔔 **Notifications**
  - Push notifications to users via FCM
  - Notification bell for both users and admins

- 🌐 **Community Features**
  - Community posts, likes, and comments
  - Comment counts and real user ID tracking

- 🔒 **Robust API Security**
  - All sensitive actions routed through secure API endpoints using a server-side Supabase client
  - Row Level Security (RLS) enforced on all tables
  - Session persistence and Redux state hydration

- 💎 **Modern Frontend**
  - Next.js 14, TypeScript, Tailwind CSS, Redux Toolkit
  - Clean, professional UI/UX

- 🚀 **SEO & Social**
  - **Dynamic sitemap**: All public and dynamic pages (including every post and tournament) are included in sitemap.xml for Google
  - **Structured data (JSON-LD)**: Organization schema added for rich results
  - **Open Graph & Twitter Cards**: Social sharing previews for all main pages
  - **next/image domain config**: Supports external avatars (Google, DiceBear, etc.)

## Tech Stack

- **Frontend Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit
- **Form Handling**: React Hook Form with Yup validation
- **UI Components**: Custom components with Tailwind CSS
- **Animations**: Framer Motion
- **Notifications**: React Hot Toast, FCM
- **Backend**: Supabase (Database, Auth, Storage, RLS)

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/Imshouvik/zelmu-esports.git
   cd zelmu-esports
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory and add your environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   # Add any other required environment variables
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
zelmu-esports/
├── src/
│   ├── app/                 # Next.js app directory (routes, pages, admin, community, etc.)
│   ├── components/          # Reusable components
│   ├── store/               # Redux store and slices
│   ├── utils/               # Utility functions and Supabase clients
│   └── types/               # TypeScript types
├── public/                  # Static assets
├── package.json             # Project dependencies
└── README.md                # Project documentation
```

## Development

- **Code Style**: Follow the TypeScript and ESLint configurations
- **Commits**: Use conventional commits format
- **Branches**: 
  - `main`: Production-ready code
  - `develop`: Development branch
  - `feature/*`: Feature branches

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@zelmu-esports.com or join our Discord server. 

## SEO & Social

- **Sitemap**: Automatically generated and includes all dynamic content (posts, tournaments)
- **robots.txt**: Configured for optimal crawling
- **Structured Data**: Organization JSON-LD for rich Google results
- **Open Graph & Twitter Cards**: Social previews for all major pages
- **Image Domains**: next/image configured for Google and DiceBear avatars 