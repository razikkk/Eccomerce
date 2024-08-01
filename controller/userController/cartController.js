const { error } = require('console')
// const cartModel = require('../../models/cartModel')
const Cart=require('../../models/cartModel')
const Product=require('../../models/products')
const User=require('../../models/userModel')
const mongoose=require('mongoose')

const loadCart=async(req,res)=>{
    try {
        const userId=req.session.userId
        const cartDatas = await Cart.findOne({ userId:userId }).populate("products.productId");
        console.log(cartDatas)
        res.render('cart',{isLogin: req.session.userId ? true : false,cartDatas:cartDatas})
        
    } catch (error) {
        console.log(error.message)
    }
}

const addToCart=async(req,res)=>{
    try {
        const {productId,quantity}=req.body;
        console.log(req.session.userId)
    
      
        const alreadyInCart = await Cart.findOne({ userId: req.session.userId });
        
        if (!alreadyInCart) {
            const cartItem = new Cart({
                userId: req.session.userId,
                products: [{ productId: productId,quantity:quantity }],
               
            })
          
            await cartItem.save();
           

            return res.json({ success: true });
        } else {
            let flag = 0;
            alreadyInCart.products.forEach((item) => {
                if (item.productId == productId) {
                    flag = 1;
                }
            });


            if (flag == 0) {
                await Cart.updateOne(
                    { userId: req.session.userId },
                    { $push: { products: { productId: productId } } }
                )
                res.json({ success: true,message:'Product added to cart successfully' })
            } else {
                res.json({ success: false,message:'product is already in the cart' })
            }
        }
        
    } catch (error) {
        console.log(error.message)
        res.status(500).json({error:'An Error Occured'})
    }
}

const updateCart = async (req, res) => {
    try {
        const { quantities } = req.body;
        const userId = req.session.userId;

        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const cart = await Cart.findOne({ userId }).populate('products.productId');
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        let newTotalPrice = 0;
        let totalQuantity = 0;

        for (const productId in quantities) {
            console.log(productId);
            const quantity = quantities[productId];
            console.log(quantity);
            const product = cart.products.find(p => p._id.toString() === productId);
            console.log(product);
            if (product) {
                product.quantity = quantity;
                newTotalPrice += product.productId.discountPrice * product.quantity;
                totalQuantity += product.quantity;
            }
        }
        cart.totalQuantity = totalQuantity; // Save the total quantity in the cart

         // Mark the nested array as modified
         cart.markModified('products');
        await cart.save();

        res.json({ success: true, totalPrice: cart.totalPrice, totalQuantity: cart.totalQuantity });
    } catch (error) {
        console.error('Error updating cart:', error);
        res.status(500).json({ error: 'An error occurred while updating the cart' });
    }
};




const deleteFromCart = async (req, res) => {
    const { productId } = req.params;
    const userId = req.session.userId;

    try {
        // Find the user's cart
        let cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        // Filter out the product to be removed
        cart.products = cart.products.filter(item => item.productId.toString() !== productId);

        // Save the updated cart
        await cart.save();

        res.json({ success: true, message: 'Product has been removed' });
    } catch (error) {
        console.log('Error removing product from cart:', error.message);
        res.status(500).json({ error: 'An error occurred while removing the product from the cart' });
    }
};

module.exports={
    loadCart,
    addToCart,
    updateCart,
    deleteFromCart
}