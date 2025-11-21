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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Auto-detect build path (compatible for Render)
const rootDir = path.join(__dirname, "..", "..");           // -> dist/
const clientBuildPath = path.join(rootDir, "public");       // -> dist/public
const indexHtml = path.join(clientBuildPath, "index.html");

const app = express();
app.set("trust proxy", 1);

// SESSION SETUP
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

app.use(
  session({
    store: new MemStore({ checkPeriod: 86400000 }),
    secret: process.env.SESSION_SECRET || "aisg-secret",
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 86400000,
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

// API LOGGER
app.use((req, res, next) => {
  const start = Date.now();
  const route = req.path;
  let captured: any;

  const originalJson = res.json;
  res.json = function (body, ...args) {
    captured = body;
    return originalJson.apply(res, [body, ...args]);
  };

  res.on("finish", () => {
    if (route.startsWith("/api")) {
      let line = `${req.method} ${route} ${res.statusCode} in ${
        Date.now() - start
      }ms`;
      if (captured) line += ` :: ${JSON.stringify(captured)}`;
      if (line.length > 90) line = line.slice(0, 89) + "…";
      log(line);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use("/api/enterprise", enterpriseRoutes);

  app.use((err: any, _req, res: Response, _next) => {
    res.status(err.status || 500).json({ message: err.message });
    throw err;
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    app.use(express.static(clientBuildPath));
  }

  app.get("/health", (_req, res) =>
    res.json({
      status: "healthy",
      service: "AISG Enterprise",
      time: Date.now(),
    })
  );

  app.get("*", (req, res) => {
    if (req.path.startsWith("/api") || req.path === "/health") {
      return res.status(404).json({ message: "Not found" });
    }
    res.sendFile(indexHtml);
  });

  const port = Number(process.env.PORT || 5000);
  server.listen(port, "0.0.0.0", () => {
    log(`🚀 AISG server running on ${port}`);
    setImmediate(() => ensureSuperadminExists());
  });
})();
