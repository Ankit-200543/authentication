const dotenv=require("dotenv");
dotenv.config();


if(!process.env.MONGO_URI){
    throw new Error("Mongo_URI is not defined in environment variable")
}
if(!process.env.JWT_SECRET_REFRESH){
    throw new Error("Refresh token is not defined in environment variable")
}
if(!process.env.JWT_SECRET_ACCESS){
    throw new Error("Access token is not defined in environment variable")
}
if(!process.env.EMAIL){
    throw new Error("Email is not defined in environment variable")
}

if(!process.env.EMAIL_PASS){
    throw new Error("Email password is not defined in environment variable")
}

const config={
    DBURL:process.env.MONGO_URI,
    refresh_token:process.env.JWT_SECRET_REFRESH,
    access_token:process.env.JWT_SECRET_ACCESS,
    EMAIL_PASS:process.env.EMAIL_PASS,
    EMAIL:process.env.EMAIL
}

module.exports=config;