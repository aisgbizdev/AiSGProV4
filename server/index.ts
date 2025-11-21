import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import connectPgSimple from "connect-pg-simple";
import { registerRoutes } from "./routes";
import enterpriseRoutes from "./routes/enterprise";
import { setupVite, log } from "./vite";
import { ensureSuperadminExists } from "./auth";
import http from "http";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Client build Vite ada di dist/ (dua level di atas dist/server/index.js)
const clientDist = path.join(__dirname, "../..");

const app = express();

// Trust proxy (Replit uses proxy)
app.set("trust proxy", 1);

// Session configuration
declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// Initialize MemoryStore for sessions (instant startup - no database dependency)
const MemStore = MemoryStore(session);
const memoryStore = new MemStore({
  checkPeriod: 86400000, // prune expired entries every 24h
});

// Session middleware
app.use(
  session({
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
  })
);

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: false }));

// Set proper Content-Type for Excel files
app.use("/templates/*.xlsx", (_req, res, next) => {
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="employee-upload.xlsx"'
  );
  next();
});

// Simple API logger
app.use((req, res, next) => {
  const start = Date.now();
  const pathReq = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (pathReq.startsWith("/api")) {
      let logLine = `${req.method} ${pathReq} ${res.statusCode} in ${duration}ms`;
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

  // Enterprise routes (BAS upload, employee management, audits)
  app.use("/api/enterprise", enterpriseRoutes);

  // Error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Dev vs Production client serving
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    // >>> STATIC SERVE UNTUK RENDER <<<
    // Serve file hasil build Vite dari folder dist/
    app.use(express.static(clientDist));
  }

  // Health check endpoint (JSON only)
  app.get("/health", (_req, res) => {
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
    });
    res.end(
      JSON.stringify({
        status: "healthy",
        service: "AISG Enterprise",
        timestamp: Date.now(),
      })
    );
  });

  // SPA fallback: semua route selain /api & /health diarahkan ke index.html
  app.get("*", (req, res) => {
    // biar /api gak ke-override
    if (req.path.startsWith("/api") || req.path === "/health") {
      return res.status(404).json({ message: "Not found" });
    }
    res.sendFile(path.join(clientDist, "index.html"));
  });

  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);

    // Background init superadmin
    setImmediate(() => {
      ensureSuperadminExists().catch((error) => {
        console.error("Error ensuring superadmin exists:", error);
      });
    });
  });
})();
