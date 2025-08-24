# Zelmu Esports Platform

A modern, professional esports organization platform for mobile games like BGMI and Free Fire. Built with Next.js, TypeScript, Tailwind CSS, and Redux Toolkit.

## 🚀 Recent Updates & New Features

### ✨ **YouTube Integration**
- **Live Stream Management**: Real-time live stream status tracking and display
- **Video Library**: Browse and watch tournament highlights, gameplay videos, and content
- **YouTube API Integration**: Seamless connection with YouTube for content management
- **Live Stream Indicator**: Visual indicators for active live streams across the platform

### 🎵 **Audio & Music System**
- **Background Music**: Custom BGMI theme music integration
- **Music Controls**: User-controlled audio playback with play/pause functionality
- **Audio Context**: React context for managing audio state across components
- **Service Worker**: Offline audio support and caching

### 🏆 **Enhanced Tournament Management**
- **ZBCC Season 1**: Dedicated tournament season with advanced leaderboard
- **Group Status Management**: Track team qualification and group standings
- **Data Persistence**: Enhanced tournament data storage and retrieval
- **Qualification Highlighting**: Visual indicators for qualified teams

### 🔧 **Improved User Registration & Authentication**
- **Enhanced Registration Flow**: Streamlined user onboarding process
- **Profile Completion**: Guided profile setup and verification
- **OAuth Improvements**: Better social login integration and error handling
- **User Data Validation**: Comprehensive user data verification and triggers

### 📱 **Mobile-First Enhancements**
- **Progressive Web App (PWA)**: Service worker and offline capabilities
- **Responsive Design**: Optimized for all device sizes
- **Touch-Friendly UI**: Mobile-optimized interactions and gestures

### 📊 **Advanced Analytics & Tracking**
- **Google Analytics**: Comprehensive user behavior tracking
- **Performance Monitoring**: Real-time platform performance metrics
- **User Engagement**: Detailed analytics on user interactions and retention

### 🎨 **UI/UX Improvements**
- **Modern Design System**: Updated visual components and styling
- **Enhanced Navigation**: Improved user navigation and breadcrumbs
- **Dashboard Enhancements**: Better admin and user dashboard experiences
- **Component Library**: Reusable UI components with consistent design

## Features

- 🎮 **Tournament Management**
  - Create and manage tournaments with advanced options (rules, rewards, featured/upcoming, etc.)
  - Set prize pools and registration fees
  - Track team registrations
  - View tournament brackets and results
  - **NEW**: ZBCC Season 1 with advanced leaderboard and group management

- 👥 **User & Club Management**
  - User registration and authentication (email/password, OAuth)
  - Team and club registration with player details
  - Profile management and completion
  - Club invites and join via invite code
  - **Real user avatars**: Dashboard now displays real user avatars from the database
  - **NEW**: Enhanced registration flow with data validation

- 🏆 **Tournament Features**
  - Tournament listings with filters
  - Detailed tournament pages
  - Registration system
  - Prize distribution tracking
  - **NEW**: YouTube integration for tournament content and live streams

- 🛡️ **Secure Admin Panel**
  - Role-based access control (superadmin, admin, user)
  - Manage users, clubs, tournaments, and permissions
  - Real-time permission updates (UI reflects backend state instantly)
  - Push notifications to all users (with automatic cleanup of invalid FCM tokens)
  - View platform stats (users, clubs, tournaments, active members)
  - Analytics and reporting
  - **NEW**: ZBCC Manager for tournament administration

- 🔔 **Notifications**
  - Push notifications to users via FCM
  - Notification bell for both users and admins
  - **NEW**: Enhanced notification system with better delivery

- 🌐 **Community Features**
  - Community posts, likes, and comments
  - Comment counts and real user ID tracking
  - **NEW**: Enhanced community engagement features

- 🔒 **Robust API Security**
  - All sensitive actions routed through secure API endpoints using a server-side Supabase client
  - Row Level Security (RLS) enforced on all tables
  - Session persistence and Redux state hydration
  - **NEW**: Enhanced security with comprehensive user triggers

- 💎 **Modern Frontend**
  - Next.js 14, TypeScript, Tailwind CSS, Redux Toolkit
  - Clean, professional UI/UX
  - **NEW**: Progressive Web App capabilities

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
- **Audio**: Web Audio API with React Context
- **PWA**: Service Worker and offline capabilities
- **Analytics**: Google Analytics integration
- **Media**: YouTube API integration

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
   NEXT_PUBLIC_YOUTUBE_API_KEY=your_youtube_api_key
   NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=your_ga_id
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
│   │   ├── admin/           # Admin panel and management
│   │   ├── api/             # API routes including YouTube integration
│   │   ├── tournaments/     # Tournament management and ZBCC Season 1
│   │   ├── youtube/         # YouTube content and live streams
│   │   └── ...              # Other app routes
│   ├── components/          # Reusable components including new audio and YouTube components
│   ├── contexts/            # React contexts including AudioContext
│   ├── store/               # Redux store and slices
│   ├── utils/               # Utility functions, Supabase clients, and YouTube utilities
│   └── types/               # TypeScript types
├── public/                  # Static assets including music and data files
├── package.json             # Project dependencies
└── README.md                # Project documentation
```

## 🎵 Audio & Music Features

The platform now includes comprehensive audio management:
- **Background Music**: Custom BGMI theme integration
- **Audio Controls**: User-controlled playback with React Context
- **Service Worker**: Offline audio support and caching
- **Music Integration**: Seamless audio experience across the platform

## 📺 YouTube Integration

Enhanced content management with YouTube:
- **Live Streams**: Real-time status tracking and display
- **Video Library**: Browse tournament highlights and gameplay content
- **API Integration**: Seamless YouTube data management
- **Content Discovery**: Enhanced user engagement through video content

## 🔧 Database & Backend Improvements

Recent backend enhancements include:
- **User Triggers**: Comprehensive data validation and integrity
- **Enhanced Security**: Improved Row Level Security and permissions
- **Data Management**: Better tournament and user data handling
- **Performance**: Optimized database queries and caching

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

## 🚀 Deployment & Hosting

The platform is optimized for production deployment:
- **Build Optimization**: Efficient Next.js builds with proper asset handling
- **Performance**: Optimized loading and rendering
- **SEO Ready**: Comprehensive SEO optimization and social sharing
- **Mobile Optimized**: Progressive Web App capabilities

## 📱 Progressive Web App Features

- **Offline Support**: Service worker for offline functionality
- **App-like Experience**: Native app feel on mobile devices
- **Push Notifications**: Enhanced user engagement
- **Fast Loading**: Optimized performance and caching

---

**Last Updated**: August 2025  
**Version**: 2.0.0  
**Platform**: Next.js 14 + Supabase + Firebase 