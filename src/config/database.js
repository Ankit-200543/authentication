const mongoose=require("mongoose");
const config=require("./config")


async function connectDB(){
try{
    await mongoose.connect(config.DBURL)
    console.log("successfully connected to Database")
}
catch(err){
    console.log("Something went wrong while connecting to Database " ,err)
}
}
module.exports=connectDB;