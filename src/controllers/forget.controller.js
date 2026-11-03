const userModel = require('../models/user.model');
const sessionModel = require("../models/session.model");
const forgetOTP = require('../models/forgetOTP.model');
const config = require("../config/config");
const crypto = require('crypto');
const jwt = require("jsonwebtoken");
const validator = require('validator');

function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

const sendOTP = async function (req, res) {
    const { email } = req.body;
    if (!email || !validator.isEmail(email)) {
        return res.status(400).json({
            message: "Please provide a valid E-mail"
        });
    }

    try {
        const findUser = await userModel.findOne({ email: email });

        if (!findUser) {
            return res.status(401).json({
                message: "There is no user registered with this E-mail"
            });
        }

        let findOTP = await forgetOTP.findOne({ email: email });

        if (!findOTP) {
            findOTP = await forgetOTP.create({
                email: email,
                OTP: generateOtp(),
                validTill: new Date(Date.now() + 5 * 60 * 1000),
            });
            return res.status(200).json({
                message: "OTP sent to your E-mail successfully"
            });
        }

        findOTP.OTP = generateOtp();
        findOTP.validTill = new Date(Date.now() + 5 * 60 * 1000);
        await findOTP.save();

        return res.status(200).json({
            message: "OTP sent to your E-mail successfully"
        });
    } catch (err) {
        return res.status(500).json({
            message: "Internal server error",
            err: err.message
        });
    }
};

const validateOTP = async function (req, res) {
    try {
        const { email, OTP } = req.body;

        if (!email || !OTP || !validator.isEmail(email)) {
            return res.status(400).json({ message: "Valid email and OTP are required" });
        }

        const findOTP = await forgetOTP.findOne({ email, verified: false });
        if (!findOTP) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        if (findOTP.validTill < new Date()) {
            return res.status(400).json({ message: "OTP expired" });
        }

        if (findOTP.OTP !== OTP) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        findOTP.verified = true;
        await findOTP.save();

        return res.status(200).json({
            message: "OTP verified successfully"
        });

    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
};

const resetPassword = async function (req, res) {
    const { email, newpassword, confirmpassword } = req.body;
    if (!email || !newpassword || !confirmpassword || !validator.isEmail(email)) {
        return res.status(400).json({ message: "Please provide valid email and passwords" });
    }
    if (newpassword.trim() !== confirmpassword.trim()) {
        return res.status(400).json({ message: "New password and confirm password should be the same" });
    }
    try {
        const findOTP = await forgetOTP.findOne({ email, verified: true });
        if (!findOTP) {
            return res.status(400).json({ message: "OTP not verified for this email" });
        }
        
        const findUser = await userModel.findOne({ email: email });
        if (!findUser) {
            return res.status(400).json({ message: "No user found with this email" });
        }

        const hashedPassword = crypto.createHash('sha256').update(newpassword).digest('hex');
        findUser.password = hashedPassword;
        await findUser.save();

        // FIXED: Use findUser._id instead of newUser._id
        const refreshToken = jwt.sign({
            id: findUser._id
        }, config.refresh_token, {
            expiresIn: "7d"
        });
        const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

        const session = await sessionModel.create({
            userId: findUser._id,
            refreshTokenHash: refreshTokenHash,
            ip: req.ip,
            userAgent: req.headers['user-agent']
        });

        const accessToken = jwt.sign({
            id: findUser._id,
            sessionId: session._id,
        }, config.access_token, {
            expiresIn: "15m"
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        // Clean up verified OTP record
        await forgetOTP.deleteOne({ _id: findOTP._id });

        return res.status(200).json({
            message: "Password updated successfully",
            accessToken: accessToken,
        });
    } catch (err) {
        return res.status(500).json({ message: "Internal server error", err: err.message });
    }
};

module.exports = {
    sendOTP,
    validateOTP,
    resetPassword
};