const nodemailer = require('nodemailer');
const config = require('../config/config');

// 1. Create the transporter once outside the function (best practice)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'ak8946562@gmail.com',     // Your Gmail address
    pass: config.EMAIL_PASS,        // Your 16-character App Password
  },
});


async function sendMail(to, subject, text, html) {
  try {
    let mailOptions = {
      from: '"Authentication" <your-email@gmail.com>', 
      to: to,
      subject: subject,
      text: text,
    };

    if (html) {
      mailOptions.html = html;
    }

    let info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully! Message ID: %s', info.messageId);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error: error };
  }
}


module.exports = sendMail;