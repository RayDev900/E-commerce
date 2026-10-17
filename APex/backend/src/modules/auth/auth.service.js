import bcrypt from "bcrypt"
import { prisma } from "../../config/prisma.js";

async function register({name, email, password}){
    const hashearPassword = await bcrypt.hash(password, 10)
    console.log(Object.keys(prisma));
    try{
       const user = await prisma.user.create({
            data: {name, email, password: hashearPassword}
        })
        const {password: _, ...userSinPassword} = user
        return userSinPassword
    }
    catch(error){
        if(error.code === "P2002"){
           throw new Error("El usuario ya esta registrado ")
        }
        throw error
    }
}

async function login({email, password}){
    const user = await prisma.user.findUnique(
        { where: { email } }
    ) 
    if(!email || !user.password){
        throw new Error("Credenciales inválidas");
    }

    const isValid = await bcrypt.compare(password, user.password )
    if(!isValid){
        throw new Error("Credenciales inválidas")   
    }

    const { password: _, ...userSinPassword } = user;
    return userSinPassword;
}

export default { register, login }