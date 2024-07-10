import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";

// Load environment variables
dotenv.config();

const app = express();

// Allowed origins
const allowedOrigins = [
  "http://localhost:5173",
  "https://668e4ff9ecf8051e536f82d3--elaborate-crisp-5378ae.netlify.app",
];

// Configure CORS middleware
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// routes import
import userRouter from "./routes/user.routes.js";

// routes declaration
app.use("/api/users", userRouter);

// eg. http://localhost:8000/api/v1/users/register

export { app };
