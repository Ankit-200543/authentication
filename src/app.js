const express=require('express');
const cookieParser=require("cookie-parser")
const app=express();


const morgan=require("morgan")

const authRouter=require('./routes/auth.routes')
const forgetRouter=require('./routes/forget.routes')

app.use(morgan("dev"))
app.use(express.json())
app.use(cookieParser())


app.use('/auth',authRouter)
app.use('/forget',forgetRouter)

app.get('/',(req,res)=>{
    console.log(req)
    res.status(200).json({
        message:"Welcome to the authentication system",
    })

})





module.exports=app;