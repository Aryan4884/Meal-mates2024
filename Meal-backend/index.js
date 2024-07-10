import dotenv from "dotenv";
import { app } from "./app.js";
import connectDB from "./db/index.js";

// Load environment variables from .env file
dotenv.config({ path: "./.env" });

// Connect to MongoDB
connectDB()
  .then(() => {
    const port = process.env.PORT || 8000;

    // Start server
    app.listen(port, () => {
      console.log(`Server is running on PORT ${port}`);
    });
  })
  .catch((error) => {
    console.error("Connection Error:", error);
    process.exit(1); // Exit process with failure
  });
