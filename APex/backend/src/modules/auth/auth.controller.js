import authServices from "./auth.service.js"
import generateToken from "../auth/generateToken.js"


const registerController = async (req, res) => {
    try{
      const newUser = await authServices.register(req.body)
      res.status(201).json({message: "usuario creado exitosamente", user: newUser})
    }
    catch(error){
      res.status(400).json({message: "Error al crear usuario", error: error.message})
    }
}


const loginController = async (req, res) => {
    try{
        const user = await authServices.login(req.body)
        const token = generateToken({sub: user.id, email: user.email})
        
        res.status(200).json({message: "usuario logueado exitosamente", user: user, token: token})
    }
    catch(error){
        res.status(400).json({message: "Error al iniciar sesion", error: error.message})
    }
}

export { registerController, loginController }