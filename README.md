# Vet1Stop

A centralized hub for U.S. veterans to access resources and opportunities, connect with others, and discover veteran-owned businesses.

## Project Overview

Vet1Stop is a Next.js application that provides veterans with access to comprehensive resources across key areas:

- **Education**: Benefits, scholarships, and training opportunities
- **Health**: Healthcare services, mental health support, and wellness resources
- **Life & Leisure**: Housing, financial, family, and recreational resources
- **Careers**: Job opportunities, career training, and employment resources

Additionally, the platform includes community-focused features:

- **Local**: Find veteran-owned businesses in your area
- **Shop**: Support veteran entrepreneurs by shopping their products
- **Social**: Connect with other veterans, join groups, and attend events

## Tech Stack

- **Frontend**: Next.js 14+ with App Router, React, TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Firebase Authentication
- **Database**: MongoDB Atlas
- **Hosting**: Vercel (planned)

## Getting Started

### Prerequisites

- Node.js 18.17.0 or later
- npm or yarn
- Firebase account
- MongoDB Atlas account

### Environment Setup

1. Clone the repository
2. Create a `.env.local` file in the root directory with the following variables:

```
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

# MongoDB Configuration
MONGODB_URI=

# NextAuth Configuration
NEXTAUTH_SECRET=
NEXTAUTH_URL=
```

3. Fill in the environment variables with your Firebase and MongoDB credentials

### Installation

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
src/
├── app/                 # Next.js app directory (routes)
│   ├── page.tsx         # Homepage
│   ├── layout.tsx       # Root layout
│   ├── globals.css      # Global styles
│   └── education/       # Education page route
│       └── page.tsx
├── components/          # React components
│   ├── common/          # Shared components (Header, Footer)
│   └── feature/         # Feature-specific components
├── contexts/            # React contexts
│   └── AuthContext.tsx  # Authentication context
├── lib/                 # Utility libraries
│   ├── firebase.ts      # Firebase configuration
│   └── mongodb.ts       # MongoDB connection
├── models/              # Data models
│   └── resource.ts      # Resource model definition
└── services/            # API services
    └── resourceService.ts  # Resource data service
```

## Features

### Current Implementation

- **Layout Components**: Header, Footer
- **Homepage**: Hero section, resource categories, community features
- **Education Page**: Benefits overview, quick guides, resource library
- **Resource Display System**: Grid cards, filters, search functionality
- **Authentication Context**: User sign-up and sign-in (Firebase)
- **Resource Service**: Data fetching from MongoDB

### Planned Features

- Health, Life & Leisure, Careers pages
- Local, Shop, Social community pages
- User profiles and saved resources
- Admin dashboard for resource management
- Enhanced search functionality
- Premium subscription features

## Contributing

This project is currently in active development. Please refer to the `.workflow` directory for project guidelines, architecture decisions, and development roadmap.

## License

All rights reserved.
