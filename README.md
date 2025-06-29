# Zelmu Esports Platform

A modern, professional esports organization platform for mobile games like BGMI and Free Fire. Built with Next.js, TypeScript, Tailwind CSS, and Redux Toolkit.

## Features

- 🎮 Tournament Management
  - Create and manage tournaments
  - Set prize pools and registration fees
  - Track team registrations
  - View tournament brackets and results

- 👥 User Management
  - User registration and authentication
  - Team registration with player details
  - Profile management

- 🏆 Tournament Features
  - Tournament listings with filters
  - Detailed tournament pages
  - Registration system
  - Prize distribution tracking

- 🎯 Admin Dashboard
  - Tournament management
  - Registration management
  - User management
  - Analytics and reporting

## Tech Stack

- **Frontend Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit
- **Form Handling**: React Hook Form with Yup validation
- **UI Components**: Custom components with Tailwind CSS
- **Animations**: Framer Motion
- **Notifications**: React Hot Toast

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/zelmu-esports.git
   cd zelmu-esports
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory and add your environment variables:
   ```
   NEXT_PUBLIC_API_URL=your_api_url
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
│   ├── app/                 # Next.js app directory
│   │   ├── (auth)/         # Authentication routes
│   │   ├── dashboard/      # Admin dashboard
│   │   ├── tournaments/    # Tournament pages
│   │   └── layout.tsx      # Root layout
│   ├── components/         # Reusable components
│   ├── store/             # Redux store and slices
│   └── types/             # TypeScript types
├── public/                # Static assets
└── package.json          # Project dependencies
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