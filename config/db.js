const mongoose = require('mongoose');
require('dotenv').config();

const dbUrl = process.env.MONGODB;
function connectDb(){

    mongoose.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true })
      .then(() => console.log('Connected to MongoDB'))
      .catch((error) => console.error('MongoDB connection error:', error));
}


  module.exports = connectDb