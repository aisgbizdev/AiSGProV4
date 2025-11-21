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

// =====================================================
// FIXED PATH FOR RENDER PRODUCTION BUILD
// Backend: dist/server/index.js
// Frontend: dist/public/index.html
// So we must go 2 levels up → dist → public
// =====================================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientBuildPath = path.join(__dirname, "../../public");

const app = express();

// Render / Replit proxy
app.set("trust proxy", 1);

// Extend session typing
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

// Memory session store
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

// Excel template header fix
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

// API logger
app.use((req, res, next) => {
  const start = Date.now();
  const pathReq = req.path;
  let captured: any;

  const original = res.json;
  res.json = function (data, ...args) {
    captured = data;
    return original.apply(res, [data, ...args]);
  };

  res.on("finish", () => {
    if (pathReq.startsWith("/api")) {
      let line = `${req.method} ${pathReq} ${res.statusCode} in ${Date.now() - start}ms`;
      if (captured) line += ` :: ${JSON.stringify(captured)}`;
      if (line.length > 80) line = line.slice(0, 79) + "…";
      log(line);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use("/api/enterprise", enterpriseRoutes);

  // Error Handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    res.status(err.status || 500).json({ message: err.message || "Internal Server Error" });
    throw err;
  });

  // ================================================
  // DEV vs PROD BUILD SERVING
  // ================================================
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    // Serve React Build from /dist/public
    app.use(express.static(clientBuildPath));
  }

  // Health Check
  app.get("/health", (_req, res) => {
    res.json({
      status: "healthy",
      service: "AISG Enterprise",
      timestamp: Date.now(),
    });
  });

  // ================================================
  // SPA FALLBACK — React Router
  // ================================================
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api") || req.path === "/health") {
      return res.status(404).json({ message: "Not found" });
    }

    res.sendFile(path.join(clientBuildPath, "index.html"));
  });

  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(port, "0.0.0.0", () => {
    log(`Server running on port ${port}`);

    // Background: ensure superadmin exists
    setImmediate(() => {
      ensureSuperadminExists().catch((err) =>
        console.error("Error ensuring superadmin exists:", err)
      );
    });
  });
})();
