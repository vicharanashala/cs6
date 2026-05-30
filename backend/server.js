// server.js
// Entry point — loads env, connects to MongoDB, starts the Express server

import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import connectDB from "./src/config/db.js";
import "./src/models/index.js"; // Register models so Mongoose builds indexes and creates collections

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect to MongoDB first
  await connectDB();

  // Ensure superadmin account exists
  try {
    const { seedSuperadmin } = await import("./src/utils/seedSuperadmin.js");
    await seedSuperadmin();
  } catch (err) {
    console.error("[Seeder] Failed to load or execute seedSuperadmin:", err.message);
  }

  // Initialize Vector Search Index and Sync Existing Embeddings in background
  try {
    const { initializeVectorIndex, syncExistingEmbeddings } = await import("./src/utils/vectorSearch.js");
    initializeVectorIndex().then(() => {
      syncExistingEmbeddings();
    }).catch(err => {
      console.error("[VectorSearch] Background index initialization failed:", err.message);
    });
  } catch (err) {
    console.error("[VectorSearch] Failed to load vectorSearch helpers:", err.message);
  }

  // Start Express
  app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}\n`);
  });
};

startServer();
