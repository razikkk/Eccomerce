const User=require('../../models/userModel')
const Product=require('../../models/products')
const Category=require('../../models/category')
const Order=require('../../models/orderModel')
const Cart=require('../../models/cartModel')
const Address=require('../../models/addressModel')
const Wallet = require('../../models/walletModel')
const mongoose=require('mongoose')
const products = require('../../models/products')
const ObjectId=mongoose.Types.ObjectId
const Razorpay = require('razorpay')
const { onlinePayment, verifyOnlinePayment } = require('../../services/onlinePayment')
const dotenv = require('dotenv')
const { verify } = require('crypto')
const pdfDocument = require('pdfkit')
const category = require('../../models/category')
const { totalmem } = require('os')
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

        if (orderData.paymentMethod === "cod" && req.body.totalPrice > 1000) {
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

        if (orderData.paymentMethod === 'cod' && req.body.totalPrice <= 1000) {
            for (const item of orderData.items) {
                const product = await Product.findByIdAndUpdate(
                    item.productId,
                    { $inc: { stock: -item.quantity } },
                    { new: true } 
                );
                if (product) {
                    product.orderCount = product.orderCount ? product.orderCount + 1 : 1;
                    await product.save();
                    // console.log(product.orderCount);
                }
                const catId = product.categoryId
                
                const cate = await category.findById(catId)
                if (cate) {
                    cate.orderCount = cate.orderCount ? cate.orderCount + 1 : 1;
                    await cate.save();
                    
                }

            }
            orderData.paymentStatus = "pending";
            await orderData.save();
            await Cart.deleteOne({ userId: req.session.userId });
            res.status(200).json({ success: true, paymentStatus: 'COD' });
        } else if (orderData.paymentMethod === 'RazorPay') {
            orderData.paymentStatus = "pending";
            orderData.items.forEach((elem)=>elem.itemStatus = "pending")
            await orderData.save();
            let razorpayOrder = await onlinePayment(orderData.totalPrice, orderData._id);
            res.json({ status: 'success', paymentStatus: 'ONLINE-PAYMENT', newOrder: razorpayOrder });
        }else if(orderData.paymentMethod === 'wallet'){
            const userWallet = await Wallet.findOne({userId:req.session.userId})
            if(userWallet && userWallet.balance >= req.body.totalPrice){
                userWallet.balance -= req.body.totalPrice
                
                userWallet.transactions.push({
                    description: `Payment for Order #${orderData.orderId}`,
                    amount: req.body.totalPrice,
                    type: 'debit',
                });
        
                await userWallet.save()

                for(const item of orderData.items){
                    const product = await Product.findByIdAndUpdate(
                        item.productId,
                        {$inc:{stock: -item.quantity}},
                        {new:true}
                    );
                    if(product){
                        product.orderCount = product.orderCount ? product.orderCount +1 :1
                        await product.save()
                    }
                    const catId = product.categoryId
                    const cate = await Category.findById(catId)
                    if(cate){
                        cate.orderCount = cate.orderCount ? cate.orderCount + 1 : 1
                        await cate.save()
                    }
                }
                orderData.paymentStatus = 'completed'
                await orderData.save()
                await Cart.deleteOne({userId:req.session.userId})
                res.json({success:true,paymentStatus:'WALLET'})
            }else{
                res.json({success:false,message:"Insuffient Balance"})
            }
        }
    } catch (error) {
        console.error('Error creating order:', error);
        res.render('500')
    }
};
const repay = async(req,res)=>{
    try {
        const response = await onlinePayment(req.body.totalPrice,req.body.orderId);
        console.log(response)
        res.json({success:true,newOrder:response});
    } catch (error) {
        console.log('error on repay',error);
    }
}

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
            order.items.forEach((elem)=>elem.itemStatus = 'ordered');
            await order.save();

            // Reduce stock
            for (const item of order.items) {
               const product =  await Product.findByIdAndUpdate(
                    item.productId,
                    { $inc: { stock: -item.quantity } }
                );
                if (product) {
                    product.orderCount = product.orderCount ? product.orderCount + 1 : 1;
                    await product.save();
                    console.log(product.orderCount);
                }
                const catId = product.categoryId
                
                const cate = await category.findById(catId)
                if (cate) {
                    cate.orderCount = cate.orderCount ? cate.orderCount + 1 : 1;
                    await cate.save();
                    
                }
            }

            // Delete cart
            await Cart.deleteOne({ userId: userId });

            res.json({ status: 'success', paymentStatus: 'ONLINE-PAYMENT-SUCCESS' });
        } else {
            res.json({ status: 'failed', message: 'Payment verification failed' });
        }
    } catch (error) {
        console.log(error);
        res.render('500')
        }
};


const orderComplete=async(req,res)=>{
    try {
       
        const userData = await User.findOne({ _id: req.session.userId })
        
        const orderData=await Order.findOne({userId : req.session.userId});
        await Cart.deleteOne({ userId: req.session.userId })
        res.render("orderComplete", { user: userData, order: orderData ,isLogin: req.session.userId ? true : false,cartCount:req.session.userId ? req.session.cartCount : 0 })
    } catch (error) {
        console.log(error.message)
        res.render('500')
    }
}


const generateInvoice = async (req, res) => {
    const { orderId, itemId } = req.params;
    try {
        const order = await Order.findById(orderId).populate('items.productId');
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        const item = order.items.find(item => item._id.toString() === itemId);
        if (!item) {
            return res.status(404).json({ success: false, message: "Item not found" });
        }

        const address = order.address;
        const doc = new pdfDocument({
            size: 'A4',
            margin: 50
        });

        res.setHeader('Content-Disposition', `attachment; filename=Invoice_${orderId}_${itemId}.pdf`);
        res.setHeader('Content-Type', 'application/pdf');

        // Pipe the document to the response
        doc.pipe(res);

        // Header section
        doc.fontSize(25).text('ESSENZI', { align: 'left' }).moveDown(0.5);
        doc.fontSize(20).text('INVOICE', { align: 'center' }).moveDown(1.5);

        // Order and item details on the left
        doc.fontSize(12)
            .text(`Order ID: ${order._id}`, { align: 'left' })
            .moveDown(0.5)
            .text(`Item Name: ${item.productId.name}`, { align: 'left' })
            .moveDown(0.5)
            .text(`Price: Rs. ${item.itemPrice}`, { align: 'left' })
            .moveDown(0.5)
            .text(`Quantity: ${item.quantity}`, { align: 'left' })
            .moveDown(0.5)
            .text(`Paid Amount: Rs. ${item.productId.discountPrice * item.quantity}`, { align: 'left' })
            .moveDown(0.5)
            .text(`Status: ${item.itemStatus}`, { align: 'left' })
            .moveDown(0.5)
            .text(`Payment Method: ${order.paymentMethod}`, { align: 'left' })
            .moveDown(1.5);

        // Address on the right
        const rightX = 300;
        doc.fontSize(12)
            .text(`Billing Address:`, rightX, 150)
            .moveDown(0.5)
            .text(`Name: ${address.name}`, rightX)
            .moveDown(0.5)
            .text(`Street: ${address.street}`, rightX)
            .moveDown(0.5)
            .text(`City: ${address.city}`, rightX)
            .moveDown(0.5)
            .text(`State: ${address.state}`, rightX)
            .moveDown(0.5)
            .text(`Zipcode: ${address.zipcode}`, rightX)
            .moveDown(0.5)
            .text(`Mobile: ${address.mobile}`, rightX)
            .moveDown(1.5);

        // Footer or Thank you note
        doc.moveDown(2);
        doc.text('Thank you for your purchase!', { align: 'center' });

        // Finalize the PDF and end the stream
        doc.end();

    } catch (error) {
        console.log(error.message);
        res.render('500');
    }
};





module.exports={
    createOrder,
    orderComplete,
    verifyPayment,
    generateInvoice,
    repay
}