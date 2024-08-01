const mongoose=require('mongoose')
const Schema=mongoose.Schema
const objectId= mongoose.Schema.Types.objectId

const orderSchema=new Schema({
    orderId:{
        type:Number,
        required:true
    },
    userId:{
        type:Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    paymentMethod:{
        type:String,     
    },
    paymentStatus:{
        type:String,
    },
    status:{
        type:String,
        default:"pending",
        required:true
    },
    totalPrice:{
        type:Number
    },
    items:[
        {
            productId:{
                type:Schema.Types.ObjectId,
                ref:"product",
                required:true
            },
            itemStatus:{
                type:String,
                required:true,
                default:"ordered"
            },
            itemPrice:{
                type:Number,
                required:true
            },

            quantity:{
                type:Number,
                required:true
            },
            returnStatus: {
                type: String,
                enum: ['none', 'requested', 'approved', 'rejected', 'returned'],
                default: 'none'
            },
            returnReason: {
                type: String,
                default: ''
            },
            isApproved:{
                type:Boolean
            },
            
        }
    ],
    address:{
        name:{
            type:String,
            required:true
        },
        street:{
            type:String
        },
        city:{
            type:String
        },
        state:{
            type:String
        },
        zipcode:{
            type:Number
        },
        mobile:{
            type:Number
        }

    },
    date:{
        type:Date,
        default:Date.now,
        required:true
    }


})

module.exports = mongoose.model("Order",orderSchema)