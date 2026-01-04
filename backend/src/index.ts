import express from "express";
import cors from "cors";
import userRoutes from "./modules/user/user.routes.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/user", userRoutes);

app.get("/health", (_, res) => {
  res.json({ status: "ok" });
});

app.listen(3001, () => {
  console.log("Backend running on http://localhost:3001");
});