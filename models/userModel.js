const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    googleId:{
        type:String,
        required:false
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
        required: false
    },
    password: {
        type: String,
        required: false
    },
    wishlist:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"product"
    }],
    balance:{
        type:Number,
        default:0
    },
    sales:{
        type:Number
    },
    is_blocked: {
        type: Boolean,
        required: true,
        default: false,
    },
});

module.exports=mongoose.model('User',userSchema)