# Reusable Tourist Items - Frontend

React + Vite app with TailwindCSS, Firebase Auth, Leaflet maps, and API integration.

## Setup

1. **Install dependencies** (requires Node.js/npm or alternative package manager):
   ```bash
   npm install
   # or: yarn install / pnpm install
   ```

2. **Configure Firebase**:
   - Copy `.env.example` to `.env`
   - Add your Firebase credentials from [Firebase Console](https://console.firebase.google.com/)

3. **Start dev server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

## Project Structure

```
src/
├── pages/           # Route pages (Login, Dashboard, Points)
├── components/      # Reusable UI components (Navbar, Map, Modals)
├── utils/           # Firebase, API clients, blockchain helpers
├── App.jsx          # Main app with routing
└── main.jsx         # Entry point
```

## Features

- **Login/Auth**: Firebase Google sign-in (`/login`)
- **Dashboard**: Leaflet map with item listings (`/dashboard`)
- **Donate**: Modal to submit reusable items with QR/form
- **Points**: View earned points and redeem rewards (`/points`)

## Environment Variables

See `.env.example` for required Firebase and API config.

## Tech Stack

- React 19 + Vite
- TailwindCSS
- Firebase Auth
- React Router
- Leaflet + React-Leaflet
- Axios
