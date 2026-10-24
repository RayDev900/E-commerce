import { z } from "zod";

export const validate = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      return res.status(400).json({
        message: "Datos de entrada inválidos",
        errors: error.errors,
      });
    }
  };
};
