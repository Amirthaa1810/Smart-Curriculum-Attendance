import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { seedDatabase } from "./seedCore.js";
import { config } from "../config/index.js";

// Runs the full API against an in-memory MongoDB (auto-seeded).
// No local MongoDB installation required — great for demos.
const start = async () => {
  console.log("Starting in-memory MongoDB (no installation required)...");
  const mongod = await MongoMemoryServer.create({
    binary: { version: "6.0.20" },
  });
  const uri = mongod.getUri("smart_curriculum");
  await mongoose.connect(uri);
  console.log(`In-memory MongoDB: ${uri}`);

  await seedDatabase();

  const { default: app } = await import("../app.js");
  app.listen(config.port, () => {
    console.log(`🚀 API running on http://localhost:${config.port}`);
    console.log("   (Ctrl+C to stop)");
  });

  const shutdown = async () => {
    await mongoose.disconnect();
    await mongod.stop();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
};

start().catch((err) => {
  console.error("Failed to start memory server:", err);
  process.exit(1);
});
