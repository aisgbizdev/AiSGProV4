import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import connectPgSimple from "connect-pg-simple";
import { registerRoutes } from "./routes";
import enterpriseRoutes from "./routes/enterprise";
import { setupVite, serveStatic, log } from "./vite";
import { ensureSuperadminExists } from "./auth";
import http from "http";

const app = express();

// Trust proxy (Replit uses proxy)
app.set('trust proxy', 1);

// Session configuration
declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

// Initialize MemoryStore for sessions (instant startup - no database dependency)
// Will be used until PostgreSQL session store is ready
const MemStore = MemoryStore(session);
const memoryStore = new MemStore({
  checkPeriod: 86400000, // prune expired entries every 24h
});

// Session middleware (initially uses MemoryStore for instant startup)
app.use(session({
  store: memoryStore,
  secret: process.env.SESSION_SECRET || "aisg-secret-key-change-in-production",
  resave: false,
  saveUninitialized: false,
  proxy: true,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: "lax",
    path: "/",
  },
}));

app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

// Set proper Content-Type for Excel files
app.use('/templates/*.xlsx', (req, res, next) => {
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="employee-upload.xlsx"');
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);
  
  // Register enterprise routes (BAS upload, employee management, audits)
  app.use('/api/enterprise', enterpriseRoutes);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
  // === STATIC SERVE FIX FOR RENDER ===

  import path from "path";
  import { fileURLToPath } from "url";

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // DIST root folder (client build output)
  const clientDist = path.join(__dirname, "../..");

  // Serve static files
  app.use(express.static(clientDist));

  // SPA fallback
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
  }

  // Add health check endpoint for deployment monitoring
  // ONLY /health returns JSON - / serves the frontend app
  app.get("/health", (_req, res) => {
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    });
    res.end(JSON.stringify({ 
      status: "healthy", 
      service: "AISG Enterprise",
      timestamp: Date.now()
    }));
  });
  
  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
    
    // ========================================
    // BACKGROUND INITIALIZATION (after server ready)
    // These operations run OUTSIDE request flow to avoid blocking health checks
    // ========================================
    
    // Initialize superadmin user in background (non-blocking)
    setImmediate(() => {
      ensureSuperadminExists().catch((error) => {
        console.error("Error ensuring superadmin exists:", error);
      });
    });
    
    // Note: Using MemoryStore for sessions to ensure instant startup
    // For production persistent sessions, consider migrating to PostgreSQL
    // session store after app is stable, or use external session management
  });
})();
