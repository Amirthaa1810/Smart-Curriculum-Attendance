import mongoose from "mongoose";
import { seedDatabase } from "../backend/scripts/seedCore.js";
import { config } from "../backend/config/index.js";

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`;

export const runSeed = async (uri = config.mongoUri) => {
  await mongoose.connect(uri);
  console.log(`Connected: ${mongoose.connection.host}`);
  const result = await seedDatabase();
  await mongoose.disconnect();
  console.log("Done.");
  return result;
};

if (isMain) {
  runSeed().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
}
