const nodemailer = require('nodemailer');
require('dotenv').config();
var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },
});
const sendOtpEmail = (to,subject,name, otp) => {
    const mailOptions = {
        from: process.env.EMAIL,
        to,
        subject,
        text: `Dear ${name}. Your One Time Password is ${otp}`,
    };
       return new Promise((resolve, reject) => {
         transporter.sendMail(mailOptions, (error, info) => {
           if (error) {
             reject(error);
           } else {
             resolve(info);
           }
         });
       });
};
module.exports = { sendOtpEmail };