const User=require('../../models/userModel')
const Product=require('../../models/products')
const Category=require('../../models/category')
const Order=require('../../models/orderModel')
const Cart=require('../../models/cartModel')
const Address=require('../../models/addressModel')
const mongoose=require('mongoose')
const products = require('../../models/products')
const ObjectId=mongoose.Types.ObjectId
const Razorpay = require('razorpay')
const { onlinePayment, verifyOnlinePayment } = require('../../services/onlinePayment')
const dotenv = require('dotenv')
const { verify } = require('crypto')
require('dotenv').config();

const createOrder = async (req, res) => {
    try {
        const cartData = await Cart.findOne({ userId: req.session.userId }).populate('products.productId').populate({
            path: 'products.productId',
            populate: {
                path: 'categoryId',
                model: 'Category'
            }
        });

        const addressId = req.body.selectedAddress
        const addressFind= await Address.findById(addressId)
        
        

        if (!addressFind) {
            return res.status(400).json({ success: false, message: 'Address not found' });
        }

        
        const orderData = new Order({
            orderId: Math.floor(100000 + Math.random() * 900000),
            userId: req.session.userId,
            paymentMethod: req.body.paymentMethod,
            totalPrice: req.body.totalPrice,
            address: {
                name: addressFind.name,
                street: addressFind.street,
                city: addressFind.city,
                state: addressFind.state,
                zipcode: addressFind.zipcode,
                mobile: addressFind.mobile
            },
            items: []
        });
        if (orderData.paymentMethod === "cod" && req.body.totalPrice > 10000) {
            return res.json({ success: false, message: "Cannot place order in COD" });
        }
        if(orderData.paymentMethod =='cod' && req.body.totalPrice<=10000){
            for (const item of cartData.products) {
                let finalPrice = item.productId.price;
                if (item.productId.discountPrice) {
                    finalPrice = item.productId.discountPrice;
                }
                orderData.items.push({
                    productId: item.productId._id,
                    quantity: item.quantity
                });
                await Product.findByIdAndUpdate(
                    item.productId._id,
                    { $inc: { stock: -item.quantity } }
                );
            }
            orderData.paymentStatus = orderData.paymentMethod === "cod" ? "pending" : "completed";
            
            await orderData.save();

            res.json({ success: true ,paymentStatus:'COD'});
        }


       if(orderData.paymentMethod =='RazorPay'){
            let razorpayOrder = await onlinePayment(orderData.totalPrice,orderData._id)
            console.log(razorpayOrder,"kfj;akjskdjfaksjkdafajskdfas((((((((((((((((((((")
            res.json({ status: 'success', paymentStatus: 'ONLINE-PAYMENT', newOrder: razorpayOrder });
       }
    } catch (error) {
        console.error('Error creating order:', error.message);
        res.status(500).json({ success: false, message: 'An unexpected error occurred. Please try again later.' });
    }
};

const verifyPayment = async(req,res)=>{
    try {
        if (verifyOnlinePayment(req.body)) {
            const order = req.body.order;
            const userId = req.session.userId;
            await Order.findOneAndUpdate({ _id: order.receipt }, { $set: { status: 'Placed' } })
            const userData = await User.findOne({ _id: userId }).populate('cart.product').exec();
            userData.cart = [];
            await userData.save();
            res.json({ status: 'success', paymentStatus: 'ONLINE-PAYMENT-SUCCESS' })
        } else {
            res.json({ status: 'failed' })
        }
    } catch (error) {
        console.log(error)
    }
}


const orderComplete=async(req,res)=>{
    try {
       
        const userData = await User.findOne({ _id: req.session.userId })
        
        const orderData=await Order.findOne({userId : req.session.userId});
        await Cart.deleteOne({ userId: req.session.userId })
        res.render("orderComplete", { user: userData, order: orderData ,isLogin: req.session.userId ? true : false})
    } catch (error) {
        
    }
}

module.exports={
    createOrder,
    orderComplete,
    verifyPayment
}