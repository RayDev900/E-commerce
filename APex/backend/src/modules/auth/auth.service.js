import bcrypt from "bcrypt";
import { prisma } from "../../config/prisma.js";
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  verifyRefreshToken,
} from "./token.service.js";

async function register({ name, email, password, role }) {
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "CUSTOMER",
        provider: "LOCAL",
      },
    });
    const { password: _, ...userSinPassword } = user;
    return userSinPassword;
  } catch (error) {
    if (error.code === "P2002") {
      throw new Error("El email ya está registrado");
    }
    throw error;
  }
}

async function createSession(user) {
  const accessToken = generateAccessToken({ id: user.id, role: user.role });
  const refreshToken = generateRefreshToken(user);
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: { tokenHash, userId: user.id, expiresAt },
  });

  return { accessToken, refreshToken };
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.password) {
    throw new Error("Credenciales inválidas");
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw new Error("Credenciales inválidas");
  }

  const session = await createSession(user);
  const { password: _, ...userSinPassword } = user;
  return { user: userSinPassword, ...session };
}

async function findOrCreateOAuthUser({ provider, providerId, email, name }) {
  let user = await prisma.user.findFirst({
    where: { provider, providerId },
  });

  if (user) {
    return user;
  }

  const existingByEmail = await prisma.user.findUnique({
    where: { email },
  });

  if (existingByEmail) {
    throw new Error("EMAIL_EXISTS");
  }

  user = await prisma.user.create({
    data: {
      email,
      name,
      password: null,
      role: "CUSTOMER",
      provider,
      providerId,
    },
  });

  return user;
}

async function refreshTokenService(refreshTokenString) {
  if (!refreshTokenString) {
    throw new Error("No autorizado");
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshTokenString);
  } catch {
    throw new Error("No autorizado");
  }

  const tokenHash = hashToken(refreshTokenString);
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!stored || stored.expiresAt < new Date()) {
    throw new Error("No autorizado");
  }

  const accessToken = generateAccessToken({
    id: stored.user.id,
    role: stored.user.role,
  });

  return { accessToken };
}

async function logoutService(refreshTokenString) {
  if (!refreshTokenString) {
    return;
  }
  const tokenHash = hashToken(refreshTokenString);
  await prisma.refreshToken.deleteMany({ where: { tokenHash } }).catch(() => {});
}

export {
  register,
  login,
  createSession,
  findOrCreateOAuthUser,
  refreshTokenService,
  logoutService,
};
