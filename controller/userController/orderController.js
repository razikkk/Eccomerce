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
        const addressId = req.body.selectedAddress;
        const addressFind = await Address.findById(addressId);
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

        for (const item of cartData.products) {
            let finalPrice = item.productId.price;
            if (item.productId.discountPrice) {
                finalPrice = item.productId.discountPrice;
            }
            orderData.items.push({
                productId: item.productId._id,
                quantity: item.quantity,
                itemPrice:item.productId.price
            });
        }

        if (orderData.paymentMethod === 'cod' && req.body.totalPrice <= 10000) {
            // Reduce stock and save order for COD
            for (const item of orderData.items) {
                await Product.findByIdAndUpdate(
                    item.productId,
                    { $inc: { stock: -item.quantity } }
                );
            }
            orderData.paymentStatus = "pending";
            await orderData.save();
            await Cart.deleteOne({ userId: req.session.userId });
            res.json({ success: true, paymentStatus: 'COD' });
        } else if (orderData.paymentMethod === 'RazorPay') {
            // For Razorpay, we'll save the order but not reduce stock yet
            orderData.paymentStatus = "pending";
            await orderData.save();
            let razorpayOrder = await onlinePayment(orderData.totalPrice, orderData._id);
            res.json({ status: 'success', paymentStatus: 'ONLINE-PAYMENT', newOrder: razorpayOrder });
        }
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ success: false, message: 'An unexpected error occurred. Please try again later.' });
    }
};

const verifyPayment = async (req, res) => {
    try {
        if (verifyOnlinePayment(req.body)) {
            const orderId = req.body.order.receipt;
            const userId = req.session.userId;

            // Fetch the order
            const order = await Order.findById(orderId);
            if (!order) {
                return res.json({ status: 'failed', message: 'Order not found' });
            }

            // Update order status and payment status
            order.status = 'pending';
            order.paymentStatus = 'success';
            await order.save();

            // Reduce stock
            for (const item of order.items) {
                await Product.findByIdAndUpdate(
                    item.productId,
                    { $inc: { stock: -item.quantity } }
                );
            }

            // Delete cart
            await Cart.deleteOne({ userId: userId });

            res.json({ status: 'success', paymentStatus: 'ONLINE-PAYMENT-SUCCESS' });
        } else {
            res.json({ status: 'failed', message: 'Payment verification failed' });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: 'failed', message: 'An error occurred during payment verification' });
    }
};


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
    verifyPayment,
   
}