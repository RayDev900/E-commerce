import { Router } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import {
  registerController,
  loginController,
  refreshController,
  logoutController,
} from "./auth.controller.js";
import { validate } from "../../middleware/validate.js";

const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  name: z.string().min(1, "El nombre no puede estar vacío"),
});

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña no puede estar vacía"),
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

export { authRouter };
