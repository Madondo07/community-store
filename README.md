# Community Store

A modern community marketplace built with Expo, React Native, TypeScript, and Supabase.

This app provides a mobile-first marketplace experience for buyers, sellers, and administrators with intuitive listing discovery, checkout, messaging, and vendor onboarding.

## Key features

- Browse marketplace listings with search and filters
- View product details, vendor profiles, and ratings
- Add items to cart and complete checkout
- Review purchase confirmation and rating flows
- In-app messaging, notifications, and order tracking
- Seller registration, verification, and profile management
- Admin dashboard for marketplace oversight
- Responsive tab-based navigation with Expo Router
- Supabase integration for backend services and auth

## Tech stack

- Expo SDK 56
- React Native 0.85
- React 19
- TypeScript
- Expo Router
- Supabase JS
- Expo UI and Expo core libraries

## Getting started

```bash
npm install
npm run start
```

Then choose an Expo client or platform option:

- Android emulator or device
- iOS simulator or device
- Web browser
- Expo Go

## Available scripts

- `npm run start` - start Expo with tunnel mode
- `npm run start:local` - start Expo locally
- `npm run android` - run the app on Android
- `npm run ios` - run the app on iOS
- `npm run web` - open the app in the browser
- `npm run lint` - run Expo lint checks
- `npm run reset-project` - reset starter files using scripts/reset-project.js

## Project structure

- `app/` - Expo Router pages and routes
- `src/components/` - reusable UI components
- `src/context/` - app context and providers
- `src/data/` - mock data and fixtures
- `src/hooks/` - custom React hooks
- `src/lib/` - Supabase setup and utilities
- `src/types/` - shared TypeScript types
- `src/utils/` - helper utilities
- `assets/` - icons, images, and static assets

## Configuration

Connect your Supabase backend in `src/lib/supabase.ts` and provide the required environment variables for authentication and data storage.

## Notes

- Uses file-based routing from Expo Router
- TypeScript support is enabled via `tsconfig.json`
- Designed as a starter marketplace app that can be extended with real backend services, payments, and notifications

## Learn more

- Expo docs: https://docs.expo.dev/
- Supabase docs: https://supabase.com/docs
- Expo Router docs: https://expo.github.io/router/docs
