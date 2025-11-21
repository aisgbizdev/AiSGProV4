import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import { registerRoutes } from "./routes";
import enterpriseRoutes from "./routes/enterprise";
import { setupVite, log } from "./vite";
import { ensureSuperadminExists } from "./auth";
import http from "http";

import path from "path";
import { fileURLToPath } from "url";

// =========================
// PATH FIX FOR RENDER / DIST
// =========================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// IMPORTANT:
// Backend = dist/server/
// Frontend = dist/
// So we must go 2 levels up from dist/server to dist/
const clientBuildPath = path.join(__dirname, "../../dist");

const app = express();

// Trust proxy (Render/Replit uses proxy)
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

const MemStore = MemoryStore(session);
const memoryStore = new MemStore({
  checkPeriod: 86400000,
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

// Excel template headers
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

// Logging for /api requests
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
    if (pathReq.startsWith("/api")) {
      const duration = Date.now() - start;
      let line = `${req.method} ${pathReq} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        line += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (line.length > 80) line = line.slice(0, 79) + "…";
      log(line);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use("/api/enterprise", enterpriseRoutes);

  // Error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  // DEV vs PROD
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    // STATIC SERVE FIX FOR RENDER
    app.use(express.static(clientBuildPath));
  }

  // Health endpoint
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

  // SPA FALLBACK — Handle React Router
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api") || req.path === "/health") {
      return res.status(404).json({ message: "Not found" });
    }

    // Serve frontend index.html
    res.sendFile(path.join(clientBuildPath, "index.html"));
  });

  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(port, "0.0.0.0", () => {
    log(`Server running on port ${port}`);

    // Ensure superadmin exists (non-blocking)
    setImmediate(() => {
      ensureSuperadminExists().catch((err) => {
        console.error("Error ensuring superadmin exists:", err);
      });
    });
  });
})();
