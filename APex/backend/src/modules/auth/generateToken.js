import jwt from "jsonwebtoken"

export function generateToken(payload) {
    const token = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: "1h" });
    return token;
}