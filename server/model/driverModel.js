import mongoose from "mongoose";

const driverSchema = new mongoose.Schema({
    name:{
        type:String,
        required: true
    },
    email:{
        type:String,
        required: true
    },
    address:{
        type:String,
        required: true
    },
    role:{
        type: String,
        required: false
    }
    
})

export default mongoose.model("Drivers", driverSchema)