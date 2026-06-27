# Smart Campus Mobile Web App

A Progressive Web Application (PWA) built with React and Vite, designed for university students to track assignments, courses, and schedules. It features a mobile-first UI, persistent data storage via LocalStorage, and a push notification system powered by an Express.js backend.

## 🚀 Features

- **Mobile-First & Responsive Design**: Optimized for mobile viewports using CSS Flexbox and media queries. Clean and intuitive touch-friendly UI.
- **Assignment Tracker**: Add, edit, delete, and mark assignments as completed. Set deadlines and get reminded.
- **Push Notifications**: Integrated with Web Push API to schedule backend-driven notifications for upcoming assignments (PWA Feature).
- **Profile & Schedule Management**: Track academic progress (credits completed) and manage daily lecture schedules.
- **Offline Data Persistence**: Utilizes custom `useLocalStorage` hooks to persist user data across sessions without a database.

## 📁 Architecture & Codebase Structure

The application follows a decoupled client-server architecture.

### Frontend (React + Vite)
- **`/src/components`**: Reusable UI components like `Navbar` (bottom navigation for mobile) and `Modal`.
- **`/src/pages`**: Main application views (`Dashboard`, `Assignments`, `Profile`, `Settings`) structured for React Router.
- **`/src/hooks`**: Custom React hooks:
  - `useLocalStorage.js`: Synchronizes state with browser `localStorage`.
  - `useNotification.js`: Manages Push API subscriptions and local notification permissions.
- **`/src/utils`**: Helper functions like `dateUtils.js` for date formatting and ID generation.
- **`/public/sw.js`**: Service Worker script to handle incoming push events in the background.

### Backend (Node.js + Express)
- **`/backend/server.js`**: Handles Push Subscriptions and schedules cron jobs using `node-schedule` to trigger notifications to subscribed devices based on assignment deadlines.

## 🛠️ Setup & Installation

### Prerequisites
- Node.js (v16+)
- npm or yarn

### Running the Application Locally

1. **Start the Backend Server**
   ```bash
   cd backend
   npm install
   npm start
   ```
   *The backend will run on port 3000.*

2. **Start the Frontend Application**
   ```bash
   # Open a new terminal from the root directory
   npm install
   npm run dev
   ```
   *The frontend will run on the port provided by Vite (e.g., 5173).*

## 📱 Evaluation Testing (Responsive Mode)
To test the responsive capabilities:
1. Open the app in Google Chrome.
2. Press `F12` to open Developer Tools.
3. Click the **Toggle Device Toolbar** icon (or `Ctrl+Shift+M`).
4. Select a mobile device (e.g., iPhone 12 Pro) and refresh the page to simulate mobile touch interactions.
