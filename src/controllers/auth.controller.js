const userModel = require('../models/user.model');
const sessionModel = require("../models/session.model")
const OTPModel = require('../models/otp.model')

const config = require("../config/config")

const crypto = require('crypto')
const jwt = require("jsonwebtoken")
const validator = require('validator')


const sendMail = require('../utils/mail');



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
        // FIXED: Added user check here before proceeding
        const findUser = await userModel.findOne({ email: email });
        if (findUser) {
            return res.status(409).json({
                message: "There is already a user with this email"
            });
        }

        let findOTP = await OTPModel.findOne({ email: email });

        if (!findOTP) {
            const newOTP = await OTPModel.create({
                email: email,
                OTP: generateOtp(),
                validTill: new Date(Date.now() + 5 * 60 * 1000),
            });
            await sendMail(email, "Your OTP Code", `Your OTP code is: ${newOTP.OTP}`);
            return res.status(200).json({
                message: "OTP sent to your E-mail successfully"
            });
        }

        findOTP.OTP = generateOtp();
        findOTP.validTill = new Date(Date.now() + 5 * 60 * 1000);
        await findOTP.save();
        await sendMail(email, "Your OTP Code", `Your OTP code is: ${findOTP.OTP}`);

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
        console.log("Incoming Request Body:", { email, OTP });

        // 1. Check if required fields are present
        if (!email || !OTP) {
            return res.status(400).json({ message: "Email and OTP are required" });
        }

        // 2. Find the unverified OTP record for this email
        const findOTP = await OTPModel.findOne({ email, verified: false });
        if (!findOTP) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        // 3. Check if the OTP has expired
        if (findOTP.validTill < new Date()) {
            return res.status(400).json({ message: "OTP expired" });
        }

        // 4. Check if the provided OTP matches the stored one
        if (findOTP.OTP !== OTP) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        // 5. Mark as verified and save
        findOTP.verified = true;
        await findOTP.save();

        return res.status(200).json({
            message: "OTP verified successfully"
        });

    } catch (error) {
        console.error("Error validating OTP:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

const register = async function (req, res) {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({
            message: "Please provide all required fields"
        })
    }
    try {
        const isAlreadyRegistered = await userModel.findOne({
            $or: [
                { username: username },
                { email: email }
            ]
        })
        if (isAlreadyRegistered) {
            return res.status(409).json(
                { message: "User already registered" }
            );
        }
        const findOTP = await OTPModel.findOne({
            email: email,
            verified: true
        })
            if(findOTP.updatedAt-  Date.now() === 5 * 60 * 1000) {
                

            }
            if (!findOTP) {
            return res.status(403).json({
                message: "Please verify your email first"
            })
        }
        const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");
         

        const newUser = await userModel.create({
            username,
            email,
            password: hashedPassword
        })

        const refreshToken = jwt.sign({
            id: newUser._id
        }, config.refresh_token, {
            expiresIn: "7d"
        })
        const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');


        const session = await sessionModel.create({
            userId: newUser._id,
            refreshTokenHash: refreshTokenHash,
            ip: req.ip,
            userAgent: req.headers['user-agent']
        })

        const accessToken = jwt.sign({
            id: newUser._id,
            sessionId: session._id,
        }, config.access_token, {
            expiresIn: "15m"
        })

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        })

        res.status(201).json({
            message: "new User created succeesfully",
            accessToken,
            user: newUser
        })
        const otpRecord = await OTPModel.findOne({ email: email });
        if (otpRecord) {
            await OTPModel.deleteOne({ _id: otpRecord._id });
        }

    } catch (err) {
        res.status(500).json({
            message: "internal server error",
            err: err
        })
    }
}


const Login = async function (req, res) {
    const { email, password } = req.body;

    try{
    const user = await userModel.findOne({ email });
    if (!user) {
        return res.status(404).json({
            message: "User not found"
        })
    }

    const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");
    if (hashedPassword !== user.password) {
        return res.status(401).json({
            message: "Invalid password"
        })
    }

    const refreshToken = jwt.sign({
        id: user._id
    }, config.refresh_token, {
        expiresIn: "7d"
    })
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');


    const session = await sessionModel.create({
        userId: user._id,
        refreshTokenHash: refreshTokenHash,
        ip: req.ip,
        userAgent: req.headers['user-agent']
    })

    const accessToken = jwt.sign({
        id: user._id,
        sessionId: session._id,
    }, config.access_token, {
        expiresIn: "15m"
    })

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
    })
    res.status(200).json({
        message: " User logged in successfully created succeesfully",
        accessToken
    })
}catch (err) {
    res.status(500).json({
        message: "internal server error",
        err: err
    })

}
}

const getMe = async function (req, res) {
    const userId = req.user.id;
    try {
        const user = await userModel.findById({ _id: userId });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            })
        }
        res.status(200).json({
            message: "User fetched successfully",
            user: {
                username: user.username,
                email: user.email
            }
        })

    }catch (err) {
        res.status(500).json({
            message: "internal server error",
            err: err
        })
    }


}


const tokenRefresh = async function (req, res) {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({ message: "Refresh token not found" });
        }

        let decoded;
        try {
            decoded = jwt.verify(refreshToken, config.refresh_token);
        } catch (err) {
            return res.status(401).json({ message: "Invalid or expired refresh token" });
        }

        const user = await userModel.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ message: "User no longer exists" });
        }


        const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex')

        const session = await sessionModel.findOne({
            refreshTokenHash,
            revoked: false
        })
        if (!session) {
            return res.status(401).json({
                message: "Invalid refresh token"
            })
        }
        const newAccessToken = jwt.sign(
            { id: user._id, email: user.email },
            config.access_token,
            { expiresIn: "15m" }
        );

        const newRefreshToken = jwt.sign(
            { id: user._id },
            config.refresh_token,
            { expiresIn: "7d" }
        );

        const newRefreshTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex')

        session.refreshTokenHash = newRefreshTokenHash;
        await session.save();


        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            success: true,
            accessToken: newAccessToken,
        });
    } catch (err) {
        console.error("TokenRefresh error:", err);
        return res.status(500).json({ message: "Something went wrong" });
    }
};


const logOut = async function (req, res) {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        return res.status(401).json({
            message: "Refresh token not found"
        })
    }
    try {
        const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex')

        const session = await sessionModel.findOne({
            refreshTokenHash,
            revoked: false
        })

        if (!session) {
            return res.status(401).json({
                message: "Invalid refresh token"
            })
        }
        session.revoked = true;
        await session.save();

        res.clearCookie('refreshToken')

        res.status(200).json({
            message: "Log out Successfully"
        })
    } catch (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
}

const logOutAll = async function (req, res) {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        return res.status(401).json({
            message: "Refresh token not found"
        })
    }
    try {
        const decoded = jwt.verify(refreshToken, config.refresh_token);
        const session = await sessionModel.findOne({
            userId: decoded.id,
            revoked: false
        })

        if (!session) {
            return res.status(401).json({
                message: "Invalid refresh token"
            })
        }
        await sessionModel.updateMany({ userId: session.userId }, { revoked: true });
        res.clearCookie('refreshToken')

        res.status(200).json({
            message: "Log out from all devices Successfully"
        })
    } catch (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Internal server error" });
    }

}

const isAlreadyRegistered = async function (req, res) {
    const { email, username } = req.body;
    if (!email && !username) {
        return res.status(400).json({
            message: "Please provide either email or username"
        });
    }
    try {
        const findUser = await userModel.findOne({ username: username });
        if (findUser) {
            return res.status(409).json({
                message: "This Username already taken by another user"
            });
        }
        res.status(200).json({
            message: "Username is available"
        });
    } catch (err) {
        return res.status(500).json({
            message: "Internal server error",
            err: err.message
        });
    }


}





module.exports = {
    register,
    getMe,
    tokenRefresh,
    logOut,
    logOutAll,
    Login,
    sendOTP,
    validateOTP,
    isAlreadyRegistered
}