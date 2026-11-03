const express=require('express');
const authRouter=express.Router();

const { register ,getMe,tokenRefresh,logOut,logOutAll,Login,sendOTP,validateOTP,isAlreadyRegistered} = require('../controllers/auth.controller.js');
const verifyAccessToken = require('../middleware/auth.middleware.js');




authRouter.post('/send-otp',sendOTP)
authRouter.post("/validate", validateOTP)
authRouter.post('/register',register)
authRouter.post("/login", Login)
authRouter.post("/logout", logOut)
authRouter.post("/logoutAll", logOutAll)
authRouter.get("/getme",verifyAccessToken,getMe)
authRouter.post("/refreshToken",tokenRefresh)
authRouter.post("/available", isAlreadyRegistered)







module.exports=authRouter; 