const mongoose = require('mongoose');
const Schema = mongoose.Schema; // Correct way to get the Schema constructor

const categorySchema = new Schema({
    categoryName: {
        type: String,
        required: true
    },
    orderCount:{
        type:Number,
        default:0
    },
    is_delete: {
        type: Boolean,
        default: false
    }
    
});

module.exports = mongoose.model('Category', categorySchema); // Use 'categorySchema' for the model
