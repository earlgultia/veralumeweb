# Veralume Web - Real-Time Download Counter

A fully functional real-time download counter for the Veralume Bible app landing page.

## Features

✅ **Real-time Download Counter** - WebSocket connection for live updates
✅ **Download Tracking** - Records each download with IP and user agent
✅ **Database Persistence** - SQLite database stores all download data
✅ **Fallback Polling** - Automatically falls back to polling if WebSocket unavailable
✅ **API Endpoints** - RESTful API for download recording and statistics
✅ **Beautiful UI** - Integrated counter display with the existing design

## Installation

### 1. Install Dependencies

```bash
npm install
```

This will install:
- `express` - Web server
- `ws` - WebSocket library
- `cors` - CORS middleware
- `sqlite3` - Database

### 2. Start the Server

```bash
npm start
```

Or for development:
```bash
npm run dev
```

The server will run on `http://localhost:3000`

## How It Works

### Frontend
- **Real-time Updates**: WebSocket connection automatically receives download count updates
- **Download Button**: Clicking triggers an API call to record the download, then starts the APK download
- **Live Counter**: Displays current download count with animated indicator
- **Fallback**: If WebSocket fails, automatically switches to HTTP polling every 2 seconds

### Backend
- **Express Server**: Serves static files and API endpoints
- **WebSocket Server**: Broadcasts download count updates to all connected clients
- **SQLite Database**: Persists download records with timestamp, user agent, and IP address
- **API Endpoints**:
  - `POST /api/download` - Record a download
  - `GET /api/downloads` - Get total download count
  - `GET /api/stats` - Get detailed statistics

## Database Schema

### downloads table
- `id` (INTEGER) - Primary key
- `timestamp` (DATETIME) - When download occurred
- `user_agent` (TEXT) - User's browser info
- `ip_address` (TEXT) - User's IP address

### counter table
- `id` (INTEGER) - Always 1 (single counter)
- `total_downloads` (INTEGER) - Total download count

## API Examples

### Record a Download
```bash
curl -X POST http://localhost:3000/api/download
```

### Get Download Count
```bash
curl http://localhost:3000/api/downloads
# Returns: {"downloads": 42}
```

### Get Statistics
```bash
curl http://localhost:3000/api/stats
# Returns: {"total_downloads": 42, "total_records": 45, "unique_users": 30}
```

## Deployment

### For Production
1. Set `PORT` environment variable: `PORT=3000`
2. Use a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start server.js --name veralume
   ```

### For Vercel/Netlify
This server can be deployed as a Node.js backend. Ensure `server.js` is configured as the entry point.

## Browser Support

- Chrome, Firefox, Safari, Edge (all modern versions)
- Fallback to HTTP polling for browsers without WebSocket support
- Works offline gracefully (shows last known count)

## Real-Time Features

- WebSocket keeps connection alive
- Automatic reconnection on disconnect
- All connected users receive updates simultaneously
- Toast notification on successful download
- Animated counter indicator

## Database Backup

To backup downloads data:
```bash
cp downloads.db downloads.db.backup
```

To reset counter:
```bash
rm downloads.db
```

The database will be recreated on next server start.

## Troubleshooting

**Counter not updating?**
- Check browser console for errors
- Verify WebSocket connection: Look for "WebSocket connected" in console
- Ensure server is running on correct port

**Port already in use?**
```bash
PORT=4000 npm start
```

**Database locked error?**
- Close all connections to the database
- Restart the server

## Files

- `server.js` - Express/WebSocket server
- `package.json` - Dependencies and scripts
- `index.html` - Landing page with counter
- `downloads.db` - SQLite database (auto-created)

---

**Made with ❤️ for Veralume - Living Word**
