import { Router } from "express";
import passport from "passport";
import { z } from "zod";

import rateLimit from "express-rate-limit";
import {
  registerController,
  loginController,
  refreshController,
  logoutController,
  googleCallbackController,
} from "./auth.controller.js";
import { validate } from "../../middleware/validate.js";

const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
});

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    message: "Demasiados intentos, inténtalo de nuevo más tarde",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: {
    message: "Demasiadas solicitudes de renovación, inténtalo de nuevo más tarde",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

authRouter.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  registerController
);

authRouter.post("/login", authLimiter, validate(loginSchema), loginController);

authRouter.post("/refresh", refreshLimiter, refreshController);

authRouter.post("/logout", logoutController);

authRouter.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

authRouter.get("/google/callback", googleCallbackController);

export { authRouter };
