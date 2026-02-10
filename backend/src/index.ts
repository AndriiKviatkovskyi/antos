import express from "express";
import cors from "cors";
import userRoutes from "./modules/user/user.routes.js";
import { MultisigIndexerService } from "./modules/indexer/MultisigIndexerService.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/user", userRoutes);

app.get("/health", (_, res) => {
  res.json({ status: "ok" });
});

const PORT = 3001;

app.listen(PORT, async () => {
  console.log(`Backend running on http://localhost:${PORT}`);

  try {
    const indexer = new MultisigIndexerService();
    indexer.startPolling();
    console.log("📡 Multisig indexer started");
  } catch (err) {
    console.error("❌ Failed to start indexer", err);
  }
});