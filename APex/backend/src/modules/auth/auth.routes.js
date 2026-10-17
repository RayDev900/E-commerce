import router from 'express';
import { registerController, loginController } from './auth.controller.js';

const authRouter = router();

authRouter.post('/register', registerController);
authRouter.post('/login', loginController);

export default authRouter;