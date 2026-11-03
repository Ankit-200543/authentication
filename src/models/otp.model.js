const mongoose = require('mongoose');

const OTPschema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    OTP: { type: String, required: true }, // string, not Number — preserves leading zeros
    validTill: { type: Date, required: true }, // no `expires` — you're deleting manually
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const OTPmodel = mongoose.model('OTP', OTPschema);

module.exports = OTPmodel; // was module.export — this was silently breaking everything