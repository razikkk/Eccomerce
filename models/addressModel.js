const { ObjectId } = require('bson')
const mongoose = require('mongoose')


const addressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    name: {
        type: String,
        required: true
    },
    street: {
        type: String
    },
    city: {
        type: String
    },
    state: {
        type: String
    },
    zipcode: {
        type: Number
    },
    mobile: {
        type: Number
    }


})

module.exports = mongoose.model('address', addressSchema)
