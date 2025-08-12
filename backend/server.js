const express = require("express");
const { NextFunction, Request, Response } = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const winston = require("winston");
require("dotenv").config();

// Import routes
const authRoutes = require("./routes/auth");
const driverRoutes = require("./routes/drivers");
const routeRoutes = require("./routes/routes");
const orderRoutes = require("./routes/orders");
const simulationRoutes = require("./routes/simulation");

const app = express();

// Security middleware
app.use(helmet());

// Logging setup
const logger = winston.createLogger({
  level: "info",
  format: winston.format.colorize(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
    new winston.transports.File({
      filename: "error.log",
      level: "error",
    }),
  ],
});

// Custom request logger middleware
app.use((req, res, next) => {
  logger.info(`${res.statusCode} ${req.method} ${req.url}`, {
    timestamp: new Date().toISOString(),
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  skip: (req) => {
    // Skip rate limiting for health check endpoint

    return (
      req.path === "/api/health" ||
      req.method === "OPTIONS" ||
      process.env.NODE_ENV === "development"
    );
  },
});
app.use(limiter);

// CORS configuration
app.use(
  cors({
    origin: "*",
  })
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose
  .connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/greencart-logistics"
  )
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/routes", routeRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/simulation", simulationRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "GreenCart Logistics API",
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});
