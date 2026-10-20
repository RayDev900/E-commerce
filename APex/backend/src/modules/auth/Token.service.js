import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

export function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, decoded) => {
    if (err) {
      throw new Error("Invalid token");
    }
    return decoded;
  });
}