import express from "express";
import dotenv from "dotenv";
import authRouter from "./modules/auth/auth.routes.js";
import { authenticate } from "./middleware/auth.middleware.js";


const app = express();
dotenv.config()
const PORT = process.env.PORT;

app.use(express.json());
app.use('/api/auth', authRouter);

app.get('/', (req, res)=>{
    res.send('Hello World');
})

app.get("/me", authenticate, (req, res) => {
    res.json(req.user);
});

app.listen(PORT, ()=>{
    console.log(`Server is running on port http://localhost:${PORT}`);
})