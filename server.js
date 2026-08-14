const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Database setup
const db = new sqlite3.Database('./downloads.db', (err) => {
  if (err) {
    console.error('Database error:', err);
  } else {
    console.log('Connected to SQLite database');
    db.run(`
      CREATE TABLE IF NOT EXISTS downloads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        user_agent TEXT,
        ip_address TEXT
      )
    `, (err) => {
      if (err) console.error('Table creation error:', err);
    });

    // Initialize counter if it doesn't exist
    db.run(`
      CREATE TABLE IF NOT EXISTS counter (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        total_downloads INTEGER DEFAULT 0
      )
    `, () => {
      db.run(`
        INSERT OR IGNORE INTO counter (id, total_downloads) VALUES (1, 0)
      `);
    });
  }
});

// Get total downloads
function getDownloadCount(callback) {
  db.get('SELECT total_downloads FROM counter WHERE id = 1', (err, row) => {
    if (err) {
      console.error('Error reading count:', err);
      callback(0);
    } else {
      callback(row ? row.total_downloads : 0);
    }
  });
}

// Broadcast download count to all connected clients
function broadcastDownloadCount() {
  getDownloadCount((count) => {
    const message = JSON.stringify({ type: 'download_count', count });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
}

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('Client connected. Total clients:', wss.clients.size);

  // Send current count immediately
  getDownloadCount((count) => {
    ws.send(JSON.stringify({ type: 'download_count', count }));
  });

  ws.on('close', () => {
    console.log('Client disconnected. Total clients:', wss.clients.size);
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });
});

// Endpoint to record a download
app.post('/api/download', (req, res) => {
  const userAgent = req.headers['user-agent'];
  const ipAddress = req.ip || req.connection.remoteAddress;

  db.run(
    `INSERT INTO downloads (user_agent, ip_address) VALUES (?, ?)`,
    [userAgent, ipAddress],
    function (err) {
      if (err) {
        console.error('Error recording download:', err);
        return res.status(500).json({ error: 'Failed to record download' });
      }

      // Increment total counter
      db.run(
        `UPDATE counter SET total_downloads = total_downloads + 1 WHERE id = 1`,
        (err) => {
          if (err) {
            console.error('Error incrementing counter:', err);
          } else {
            // Broadcast updated count to all clients
            broadcastDownloadCount();
          }
        }
      );

      res.json({ success: true });
    }
  );
});

// Endpoint to get current download count
app.get('/api/downloads', (req, res) => {
  getDownloadCount((count) => {
    res.json({ downloads: count });
  });
});

// Endpoint to get download statistics
app.get('/api/stats', (req, res) => {
  getDownloadCount((count) => {
    db.get(
      `SELECT COUNT(*) as total, COUNT(DISTINCT ip_address) as unique_ips FROM downloads`,
      (err, row) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        res.json({
          total_downloads: count,
          total_records: row.total,
          unique_users: row.unique_ips
        });
      }
    );
  });
});

// Serve APK file with proper headers
app.get('/veralume.apk', (req, res) => {
  const filePath = path.join(__dirname, 'veralume.apk');
  res.download(filePath, 'veralume.apk', (err) => {
    if (err) {
      console.error('Error downloading file:', err);
      res.status(404).json({ error: 'APK file not found' });
    }
  });
});

// Serve static files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Catch-all for other static files
app.use((req, res) => {
  const filePath = path.join(__dirname, req.path);
  // Prevent directory traversal
  if (!filePath.startsWith(__dirname)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  // Try to serve as static file
  res.status(404).json({ error: 'Not found' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  db.close((err) => {
    if (err) console.error('Error closing database:', err);
  });
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
