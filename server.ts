import { createHash, randomBytes, timingSafeEqual } from "crypto";
import express, { type NextFunction, type Request, type Response } from "express";
import fs from "fs";
import admin from "firebase-admin";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_PORT = Number.parseInt(process.env.PORT ?? "3000", 10);
const DEFAULT_HEARTBEAT_INTERVAL_SECONDS = Number.parseInt(
  process.env.AGENT_HEARTBEAT_INTERVAL_SECONDS ?? "60",
  10,
);
const AGENT_CREDENTIALS_COLLECTION = "agentCredentials";

const ASSET_TYPES = ["Laptop", "Desktop", "Server", "Monitor", "Printer", "Other"] as const;
type AssetType = (typeof ASSET_TYPES)[number];

interface RegisterAgentPayload {
  hostname: string;
  os?: string;
  serialNumber: string;
  type: AssetType;
  specs?: string;
  agentVersion?: string;
}

interface AgentHeartbeatPayload {
  id: string;
  cpu?: number;
  ram?: number;
  disk?: number;
}

class HttpError extends Error {
  statusCode: number;
  expose: boolean;

  constructor(statusCode: number, message: string, expose = true) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.expose = expose;
  }
}

function hashSecret(secret: string) {
  return createHash("sha256").update(secret).digest("hex");
}

function compareSecret(secret: string, storedHash: string) {
  const secretHash = Buffer.from(hashSecret(secret), "hex");
  const expectedHash = Buffer.from(storedHash, "hex");

  if (secretHash.length !== expectedHash.length) {
    return false;
  }

  return timingSafeEqual(secretHash, expectedHash);
}

function issueAgentKey() {
  return randomBytes(32).toString("hex");
}

function normalizeString(
  value: unknown,
  fieldName: string,
  maxLength: number,
  options: { required?: boolean } = {},
) {
  if (typeof value !== "string") {
    if (options.required) {
      throw new HttpError(400, `${fieldName} is required`);
    }
    return undefined;
  }

  const normalized = value.trim();
  if (!normalized) {
    if (options.required) {
      throw new HttpError(400, `${fieldName} is required`);
    }
    return undefined;
  }

  if (normalized.length > maxLength) {
    throw new HttpError(400, `${fieldName} exceeds ${maxLength} characters`);
  }

  return normalized;
}

function normalizePercentage(value: unknown, fieldName: string) {
  if (value == null) {
    return undefined;
  }

  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 100) {
    throw new HttpError(400, `${fieldName} must be a number between 0 and 100`);
  }

  return Math.round(value * 100) / 100;
}

function normalizeAssetType(value: unknown) {
  if (typeof value !== "string") {
    return "Laptop" as AssetType;
  }

  const candidate = value.trim() as AssetType;
  return ASSET_TYPES.includes(candidate) ? candidate : "Laptop";
}

function buildAllowedOrigins(port: number) {
  const origins = new Set<string>([
    `http://localhost:${port}`,
    `http://127.0.0.1:${port}`,
  ]);

  if (process.env.APP_URL) {
    try {
      origins.add(new URL(process.env.APP_URL).origin);
    } catch {
      console.warn("APP_URL is not a valid URL. Origin checks will ignore it.");
    }
  }

  return origins;
}

function initializeFirebase() {
  if (admin.apps.length) {
    return;
  }

  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  const options: admin.AppOptions = {};

  if (fs.existsSync(configPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    if (firebaseConfig.projectId) {
      options.projectId = firebaseConfig.projectId;
    }
  }

  if (!options.projectId && process.env.GOOGLE_CLOUD_PROJECT) {
    options.projectId = process.env.GOOGLE_CLOUD_PROJECT;
  }

  admin.initializeApp(options);
}

function getFirestore() {
  initializeFirebase();
  return admin.firestore();
}

function securityHeaders(req: Request, res: Response, next: NextFunction) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  // Firebase Auth popup/redirect needs opener access across origins.
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (req.secure || forwardedProto === "https") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    );
  }

  if (process.env.NODE_ENV === "production") {
    res.setHeader(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "img-src 'self' data: https://*.googleusercontent.com",
        "font-src 'self' data:",
        "style-src 'self' 'unsafe-inline'",
        "script-src 'self'",
        "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.gstatic.com https://securetoken.googleapis.com",
      ].join("; "),
    );
  }

  next();
}

function requireJson(req: Request, _res: Response, next: NextFunction) {
  if (["POST", "PUT", "PATCH"].includes(req.method) && !req.is("application/json")) {
    next(new HttpError(415, "Content-Type must be application/json"));
    return;
  }

  next();
}

function enforceOrigin(allowedOrigins: Set<string>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const origin = req.headers.origin;

    if (origin && !allowedOrigins.has(origin)) {
      next(new HttpError(403, "Origin is not allowed"));
      return;
    }

    next();
  };
}

function createRateLimiter(windowMs: number, maxRequests: number) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const existing = hits.get(key);

    if (!existing || existing.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (existing.count >= maxRequests) {
      res.setHeader("Retry-After", Math.ceil((existing.resetAt - now) / 1000));
      next(new HttpError(429, "Too many requests"));
      return;
    }

    existing.count += 1;
    next();
  };
}

function getBootstrapToken() {
  const token = process.env.AGENT_BOOTSTRAP_TOKEN?.trim();
  if (!token) {
    throw new HttpError(503, "AGENT_BOOTSTRAP_TOKEN is not configured", false);
  }
  return token;
}

function verifyBootstrapToken(req: Request) {
  const providedToken = req.header("x-agent-bootstrap-token");
  if (!providedToken) {
    throw new HttpError(401, "Missing bootstrap token");
  }

  if (!compareSecret(providedToken, hashSecret(getBootstrapToken()))) {
    throw new HttpError(401, "Invalid bootstrap token");
  }
}

async function verifyAgentCredentials(req: Request) {
  const assetId = req.header("x-agent-id");
  const agentKey = req.header("x-agent-key");

  if (!assetId || !agentKey) {
    throw new HttpError(401, "Missing agent credentials");
  }

  const db = getFirestore();
  const credentialDoc = await db.collection(AGENT_CREDENTIALS_COLLECTION).doc(assetId).get();
  if (!credentialDoc.exists) {
    throw new HttpError(401, "Agent credentials not found");
  }

  const data = credentialDoc.data() as { keyHash?: string; active?: boolean } | undefined;
  if (!data?.keyHash || data.active === false) {
    throw new HttpError(401, "Agent credentials are inactive");
  }

  if (!compareSecret(agentKey, data.keyHash)) {
    throw new HttpError(401, "Invalid agent credentials");
  }

  return { assetId };
}

function validateRegisterAgentPayload(body: unknown): RegisterAgentPayload {
  if (!body || typeof body !== "object") {
    throw new HttpError(400, "Request body must be a JSON object");
  }

  const payload = body as Record<string, unknown>;
  return {
    hostname: normalizeString(payload.hostname, "hostname", 100, { required: true })!,
    os: normalizeString(payload.os, "os", 120),
    serialNumber: normalizeString(payload.serialNumber, "serialNumber", 64, { required: true })!,
    type: normalizeAssetType(payload.type),
    specs: normalizeString(payload.specs, "specs", 500),
    agentVersion: normalizeString(payload.agentVersion, "agentVersion", 32),
  };
}

function validateHeartbeatPayload(body: unknown): AgentHeartbeatPayload {
  if (!body || typeof body !== "object") {
    throw new HttpError(400, "Request body must be a JSON object");
  }

  const payload = body as Record<string, unknown>;
  return {
    id: normalizeString(payload.id, "id", 128, { required: true })!,
    cpu: normalizePercentage(payload.cpu, "cpu"),
    ram: normalizePercentage(payload.ram, "ram"),
    disk: normalizePercentage(payload.disk, "disk"),
  };
}

async function createApp() {
  const app = express();
  const port = DEFAULT_PORT;
  const allowedOrigins = buildAllowedOrigins(port);

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(securityHeaders);
  app.use(requireJson);
  app.use(enforceOrigin(allowedOrigins));
  app.use(express.json({ limit: "16kb", strict: true }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/agent/register", createRateLimiter(60_000, 10), async (req, res, next) => {
    try {
      verifyBootstrapToken(req);
      const payload = validateRegisterAgentPayload(req.body);
      const db = getFirestore();
      const assets = db.collection("assets");

      const snapshot = await assets
        .where("serialNumber", "==", payload.serialNumber)
        .limit(1)
        .get();

      let assetId: string;
      if (!snapshot.empty) {
        assetId = snapshot.docs[0].id;
        await assets.doc(assetId).update({
          name: payload.hostname,
          type: payload.type,
          specs: payload.specs ?? `OS: ${payload.os ?? "Unknown"}`,
          location: "Managed Agent",
          agentEnabled: true,
          agentVersion: payload.agentVersion ?? "1.0.0",
          lastSeen: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        const newAsset = await assets.add({
          name: payload.hostname,
          type: payload.type,
          serialNumber: payload.serialNumber,
          status: "Active",
          location: "Managed Agent",
          specs: payload.specs ?? `OS: ${payload.os ?? "Unknown"}`,
          agentEnabled: true,
          agentVersion: payload.agentVersion ?? "1.0.0",
          lastSeen: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        assetId = newAsset.id;
      }

      const agentKey = issueAgentKey();
      await db.collection(AGENT_CREDENTIALS_COLLECTION).doc(assetId).set({
        keyHash: hashSecret(agentKey),
        active: true,
        serialNumber: payload.serialNumber,
        rotatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.json({
        status: "ok",
        id: assetId,
        agentKey,
        intervalSeconds: DEFAULT_HEARTBEAT_INTERVAL_SECONDS,
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/agent/heartbeat", createRateLimiter(60_000, 180), async (req, res, next) => {
    try {
      const payload = validateHeartbeatPayload(req.body);
      const { assetId } = await verifyAgentCredentials(req);

      if (assetId !== payload.id) {
        throw new HttpError(403, "Agent identifier mismatch");
      }

      const realtimeUpdate: Record<string, unknown> = {};
      if (payload.cpu != null) realtimeUpdate["realtime.cpu"] = payload.cpu;
      if (payload.ram != null) realtimeUpdate["realtime.ram"] = payload.ram;
      if (payload.disk != null) realtimeUpdate["realtime.disk"] = payload.disk;

      await getFirestore().collection("assets").doc(assetId).update({
        ...realtimeUpdate,
        lastSeen: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.json({ status: "ok" });
    } catch (error) {
      next(error);
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const httpError =
      error instanceof HttpError
        ? error
        : new HttpError(500, "Internal server error", false);

    if (!(error instanceof HttpError)) {
      console.error("Unhandled server error:", error);
    }

    res.status(httpError.statusCode).json({
      error: httpError.expose ? httpError.message : "Internal server error",
    });
  });

  return app;
}

export {
  createApp,
  hashSecret,
  validateHeartbeatPayload,
  validateRegisterAgentPayload,
};

async function startServer() {
  const app = await createApp();
  app.listen(DEFAULT_PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${DEFAULT_PORT}`);
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  startServer().catch((error) => {
    console.error("Failed to start server:", error);
    process.exitCode = 1;
  });
}
