const mongoose=require('mongoose');
const UserSchema=mongoose.Schema({
    name:String,
    email:String,
    password:String
})
const Usermodel=mongoose.model("form-validate",UserSchema);
module.exports=Usermodel;