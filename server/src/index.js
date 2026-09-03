import "dotenv/config";
import express from "express";
import cors from "cors";
import { initSchema } from "./db/connection.js";

import authRoutes from "./routes/auth.js";
import businessRoutes from "./routes/businesses.js";
import moduleRoutes from "./routes/modules.js";
import recordRoutes from "./routes/records.js";
import aiRoutes from "./routes/ai.js";
import billingRoutes from "./routes/billing.js";

initSchema();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/businesses", businessRoutes);
app.use("/api/modules", moduleRoutes);
app.use("/api/records", recordRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/billing", billingRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`ERP Automiser API running on http://localhost:${PORT}`);
  console.log(`AI mode: ${process.env.ANTHROPIC_API_KEY ? "Claude API" : "offline fallback templates"}`);
});
