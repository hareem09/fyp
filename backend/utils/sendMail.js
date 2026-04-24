const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config()
const transporter = nodemailer.createTransport({
  secure:true,
  host:'smtp.gmail.com',
  port:465,
  auth: {
      user:process.env.MAIL_USER,
      pass:process.env.MAIL_PASS
  },
});

module.exports= {transporter}