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

// ==========================================
// FIX PATH FOR RENDER — DETECT dist/public
// ==========================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// dist/server/index.js → naik 1 folder → dist/
const distRoot = path.join(__dirname, "..");
// dist/public → folder frontend hasil build
const clientBuildPath = path.join(distRoot, "public");
const indexHtml = path.join(clientBuildPath, "index.html");

const app = express();

app.set("trust proxy", 1);

// ======================================================
// SESSION SETUP
// ======================================================
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

// Templates
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

// Logging
app.use((req, res, next) => {
  const start = Date.now();
  const pathReq = req.path;
  let capturedJsonResponse: any = undefined;

  const originalJson = res.json;
  res.json = function (b, ...args) {
    capturedJsonResponse = b;
    return originalJson.apply(res, [b, ...args]);
  };

  res.on("finish", () => {
    if (pathReq.startsWith("/api")) {
      const ms = Date.now() - start;
      let line = `${req.method} ${pathReq} ${res.statusCode} in ${ms}ms`;
      if (capturedJsonResponse) line += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      if (line.length > 120) line = line.slice(0, 119) + "…";
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

  // ==========================================================
  // CLIENT STATIC SERVE — FIX FOR RENDER
  // ==========================================================
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    // Serve static files from dist/public
    app.use(express.static(clientBuildPath));
  }

  // Health check
  app.get("/health", (_req, res) => {
    res.json({
      status: "healthy",
      service: "AISG Enterprise",
      timestamp: Date.now(),
    });
  });

  // SPA fallback (React Router)
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api") || req.path === "/health") {
      return res.status(404).json({ message: "Not found" });
    }

    res.sendFile(indexHtml, function (err) {
      if (err) {
        console.error("Error sending index.html:", err);
        res.status(500).send("Server Error");
      }
    });
  });

  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(port, "0.0.0.0", () => {
    log(`🚀 AISG server running on ${port}`);

    setImmediate(() => {
      ensureSuperadminExists().catch((err) => {
        console.error("Error ensuring superadmin exists:", err);
      });
    });
  });
})();
