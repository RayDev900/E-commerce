import router from 'express';
import { login, register } from './auth.controller.js';

const authRouter = router();

authRouter.post('/register', register);
authRouter.post('/login', login);

export default authRouter;