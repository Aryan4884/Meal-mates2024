import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import userRouter from "./routes/user.routes.js";

// Load environment variables
dotenv.config();

const app = express();

// Configure CORS middleware
app.use(
  cors({
    origin: "https://candid-bublanina-0fe3a7.netlify.app",
    credentials: true, // Enable credentials (cookies, authorization headers)
  })
);

// Middleware for parsing JSON and URL-encoded bodies
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// Middleware for parsing cookies
app.use(cookieParser());

// Routes
app.use("/api/users", userRouter); // Example route setup

export { app };
