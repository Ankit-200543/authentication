const express=require('express');
const forgetRouter=express.Router();
const {sendOTP,validateOTP,resetPassword}=require('../controllers/forget.controller');


forgetRouter.post('/send-otp',sendOTP);
forgetRouter.post('/verify-otp',validateOTP);
forgetRouter.post('/reset-password',resetPassword);




module.exports=forgetRouter;