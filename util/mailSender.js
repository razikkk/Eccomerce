const nodemailer = require('nodemailer');
require('dotenv').config();
const mailSender = async (email, title, body) => {
    try {
      // Create a Transporter to send emails
      let transporter = nodemailer.createTransport({
        service:'Gmail',
        auth: {
          user:process.env.EMAIL ,
          pass:process.env.OTPPASS,
        }
      });
      // Send emails to users
      let info = await transporter.sendMail({
        from: 'razik3407@gmail.com',
        to: email,
        subject: title,
        text: body
      });
      
      console.log("Email info: ", info);
      return info;
    } catch (error) {
      console.log(error.message);
    }
  };

  module.exports = mailSender;