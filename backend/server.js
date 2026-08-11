import { config } from "./config/index.js";
import { connectDB } from "./config/db.js";
import app from "./app.js";

const start = async () => {
  try {
    await connectDB();
    app.listen(config.port, () => {
      console.log(`🚀 API running on http://localhost:${config.port}`);
    });
  } catch (err) {
    console.error("Failed to start server", err);
    process.exit(1);
  }
};

start();
