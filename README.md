# Twitch Bomber Royale - Developer Guide

## Professional Deployment

### 1. Twitch App Registration
To enable real Twitch login for your players:
1. Go to [Twitch Developer Console](https://dev.twitch.tv/console).
2. Register a new Application.
3. Set **OAuth Redirect URLs** to your production URL (e.g., `https://your-app.web.app`).
4. Copy the **Client ID**.

### 2. Configuration
Create/Update `client/.env`:
```env
VITE_SERVER_URL=https://your-backend-url.render.com
VITE_TWITCH_CLIENT_ID=your_client_id_here
```

### 3. Deployment
- **Client**: `npm run build` in `/client`, then deploy the `dist` folder to Firebase/Vercel.
- **Server**: Push `/server` to Render.com. Ensure `CLIENT_ORIGIN` env variable is set to your frontend URL.

## Technical Notes
- **Guest Mode**: Allows immediate testing and play without Twitch API.
- **Persistence**: Leaderboard data is saved to `server/leaderboard.json`.
- **Latency**: Built on Socket.io for high-performance multiplayer synchronization.
