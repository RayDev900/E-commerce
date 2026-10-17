import express from "express";
import dotenv from "dotenv";
import authRouter from "./modules/auth/auth.routes.js";


const app = express();
dotenv.config()
const PORT = process.env.PORT;

app.use(express.json());
app.use('/auth', authRouter);

app.get('/', (req, res)=>{
    res.send('Hello World');
})


app.listen(PORT, ()=>{
    console.log(`Server is running on port http://localhost:${PORT}`);
})