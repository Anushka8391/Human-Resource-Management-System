const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");

const authRoutes = require("./routes/authRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : null,
  // Optional: comma-separated list of additional allowed origins (e.g. frontends)
  process.env.ALLOWED_ORIGINS,
  process.env.NODE_ENV === "development" ? "http://localhost:3000" : null,
]
  .filter(Boolean)
  .flatMap((value) => value.split(","))
  .map((origin) => origin.trim())
  .filter(Boolean);

app.set("trust proxy", 1);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser tools and same-origin calls without Origin header.
      console.error('CORS origin callback invoked', { origin });
      if (!origin) {
        return callback(null, true);
      }

      // Allow exact matches from configured allowedOrigins
      console.error('CORS allowedOrigins', { allowedOrigins });
      if (allowedOrigins.includes(origin)) {
        console.error('CORS allowed: exact match', origin);
        return callback(null, true);
      }

      // Allow Vercel-hosted frontends (convenience for preview deployments)
      // e.g. any origin that ends with `.vercel.app`
      try {
        const url = new URL(origin);
        if (url.hostname.endsWith(".vercel.app")) {
          console.error('CORS allowed: vercel.app wildcard', url.hostname);
          return callback(null, true);
        }
      } catch (e) {
        // ignore parse errors
      }

      return callback(new Error("CORS origin not allowed"));
    },
    credentials: true,
  })
);
app.use(helmet());
app.use(express.json({ limit: "200kb" }));
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => {
  res.json({ message: "HRMS API running" });
});

app.get("/", (_req, res) => {
  res.status(200).json({
    message: "HRMS backend is running",
    health: "/api/health",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ success: false, message: "Internal server error" });
});

module.exports = app;