const nodemailer = require('nodemailer');
const config = require('../config/config');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: config.EMAIL,     
    pass: config.EMAIL_PASS,     
  },
});


async function sendMail(to, subject, text, html) {
  try {
    let mailOptions = {
      from: `"Authentication" <${config.EMAIL}>`, 
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