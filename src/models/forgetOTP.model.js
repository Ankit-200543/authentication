const mongoose = require('mongoose');

const forgetOTPschema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    OTP: { type: String, required: true }, 
    validTill: { type: Date, required: true },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const forgetOTPmodel = mongoose.model('forgetOTP', forgetOTPschema);

module.exports = forgetOTPmodel;