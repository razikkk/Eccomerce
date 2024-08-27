const Order=require('../../models/orderModel')
const Product  = require('../../models/products')
const Wallet = require('../../models/walletModel')


const orderLoad = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const skip = (page - 1) * limit;
        const orders = await Order.find().populate('userId').skip(skip).limit(limit).sort({ date: -1 });
        const totalOrders = await Order.countDocuments();
        const totalPages = Math.ceil(totalOrders / limit);

        res.render('orders', { orders, currentPage: page, totalPages });
    } catch (error) {
        console.log(error.message);
    }
}

const OrderDetailsLoad=async(req,res)=>{
    try {
       const orderId = req.params.orderId
       const order = await Order.findById(orderId).populate('items.productId').populate('userId')
       console.log(order,'22334')
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
        const { orderId, newStatus,itemId } = req.body;
        const order = await Order.findById(orderId);
       const item = order.items.id(itemId)
        if (order) {
            if (item.itemStatus === 'cancelled') {
                return res.json({ success: false, message: 'Order is already cancelled.' });
            }
            if (newStatus === 'approved') {
                item.itemStatus = 'approved';
                const product = await Product.findById(item.productId)
                if(!product){
                  return res.status(404).json({success:false,message:"product not found"})
                }
                // Find the user who placed the order
                if (order.paymentMethod == 'RazorPay'|| order.paymentMethod == 'cod') {
                  const totalPrice = product.discountPrice * item.quantity;
                  console.log(totalPrice)
                  let userWallet = await Wallet.findOne({ userId: order.userId });
            
                 
                 if(userWallet) {
                      userWallet.balance += totalPrice;
                      userWallet.transactions.push({
                          type: 'credit',
                          amount: totalPrice,
                          description: 'Order returned - refund added to wallet'
                      });
                  }
            
                  await userWallet.save();
              }
            
              product.stock += item.quantity;
              await product.save();
              await order.save();
            }
            
            item.itemStatus = newStatus;
            await order.save();
            updateOverallOrderStatus(orderId);
            res.json({ success: true });
        } else {
            res.json({ success: false, message: 'Order not found.' });
        }
        if(!order){
            return res.status(404).json({success:false,message:"order not found"})
        }
        
        console.log(item)

    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: 'Error updating status.' });
    }
};

const updateOverallOrderStatus = async (orderId) => {
    // Fetch the order by ID
    const order = await Order.findById(orderId).populate('items.productId');

    // Extract item statuses
    const itemStatuses = order.items.map(item => item.itemStatus);

    // Check for 'cancelled' status
    if (itemStatuses.every(status => status === 'cancelled')) {
        order.status = 'cancelled';
    }
    // Check for 'delivered' status
    else if (itemStatuses.every(status => status === 'delivered')) {
        order.status = 'delivered';
    }
    else if (itemStatuses.every(status => status === 'approved')) {
        order.status = 'returned';
    }
    // Check for 'shipped' status
    else if (itemStatuses.some(status => status === 'shipped') && itemStatuses.every(status => status === 'shipped' || status === 'delivered')) {
        order.status = 'shipped';
    }
    // Check for 'pending' status
    else if (itemStatuses.some(status => status === 'pending')) {
        order.status = 'pending';
    }
    // Partially cancelled
    else if (itemStatuses.some(status => status === 'cancelled')) {
        order.status = 'partially cancelled';
    }

    // Save the updated order
    await order.save();
};

module.exports={
    orderLoad,
    OrderDetailsLoad,
    updateOrderStatus
}