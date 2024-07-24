const Order=require('../../models/orderModel')


const orderLoad=async(req,res)=>{
    try {
        const page=parseInt(req.query.page) || 1
        const limit=5
        const skip = (page-1)*limit
        const orders= await Order.find().populate('userId').skip(skip).limit(limit)
        const totalOrders=await Order.countDocuments()
        const totalPages=Math.ceil(totalOrders/limit)

        res.render('orders',{orders,currentPage:page,totalPages})
    } catch (error) {
        console.log(error.message)
    }
}
const OrderDetailsLoad=async(req,res)=>{
    try {
       const orderId = req.params.orderId
       const order = await Order.findById(orderId).populate('items.productId').populate('userId')
       if (!order) {
        return res.status(404).send('Order not found');
    }
        res.render('orderDetails',{order:order})
    } catch (error) {
        console.log(error.message)
    }
}
const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, newStatus } = req.body;
        const order = await Order.findById(orderId);

        if (order) {
            if (order.status === 'cancelled') {
                return res.json({ success: false, message: 'Order is already cancelled.' });
            }

            order.status = newStatus;
            await order.save();
            res.json({ success: true });
        } else {
            res.json({ success: false, message: 'Order not found.' });
        }
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: 'Error updating status.' });
    }
};
module.exports={
    orderLoad,
    OrderDetailsLoad,
    updateOrderStatus
}