import * as authServices from "./auth.service.js";

export const registerController = async (req, res) => {
  try {
    const newUser = await authServices.register(req.body);
    return res.status(201).json({
      message: "usuario creado exitosamente",
      user: newUser,
    });
  } catch (error) {
    return res.status(400).json({
      message: "Error al crear usuario",
      error: error.message,
    });
  }
};

export const loginController = async (req, res) => {
  try {
    const { user, accessToken, refreshToken } = await authServices.login(
      req.body
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    return res.status(200).json({
      message: "usuario logueado exitosamente",
      user,
      accessToken,
    });
  } catch (error) {
    return res.status(401).json({
      message: "Credenciales inválidas",
    });
  }
};

export const refreshController = async (req, res) => {
  try {
    const { accessToken } = await authServices.refreshTokenService(
      req.cookies.refreshToken
    );
    return res.status(200).json({ accessToken });
  } catch {
    return res.status(401).json({
      message: "No autorizado",
    });
  }
};

export const logoutController = async (req, res) => {
  await authServices.logoutService(req.cookies.refreshToken);

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });

  return res.status(200).json({
    message: "Sesión cerrada",
  });
};
