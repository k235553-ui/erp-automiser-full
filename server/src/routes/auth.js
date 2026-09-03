import { Router } from "express";
import bcrypt from "bcryptjs";
import { Users } from "../models/index.js";
import { signToken } from "../middleware/auth.js";
import { registerSchema, loginSchema } from "../validators/schemas.js";

const router = Router();

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }
  const { email, password } = parsed.data;

  if (Users.findByEmail(email)) {
    return res.status(409).json({ error: "Email already registered" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = Users.create({ email, passwordHash });
  const token = signToken(user);
  res.status(201).json({ token, user: { id: user.id, email: user.email } });
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }
  const { email, password } = parsed.data;

  const user = Users.findByEmail(email);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = signToken(user);
  res.json({ token, user: { id: user.id, email: user.email } });
});

export default router;
