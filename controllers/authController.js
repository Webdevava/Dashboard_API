// const User = require("../models/User");
// const jwt = require("jsonwebtoken");
// const crypto = require("crypto");
// const { sendVerificationEmail } = require("../utils/emailService");

// exports.register = async (req, res) => {
//   try {
//     const { email, password, role } = req.body;
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ message: "User already exists" });
//     }

//     const verificationToken = crypto.randomBytes(20).toString("hex");
//     const user = new User({ email, password, role, verificationToken });
//     await user.save();

//     await sendVerificationEmail(user.email, verificationToken);

//     res
//       .status(201)
//       .json({
//         message:
//           "User registered. Please check your email to verify your account.",
//       });
//     console.log("User registered successfully:", email);
//   } catch (error) {
//     console.error("Registration error:", error);
//     res.status(500).json({ message: "Error registering user" });
//   }
// };

// exports.login = async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const user = await User.findOne({ email });
//     if (!user || !(await user.comparePassword(password))) {
//       return res.status(401).json({ message: "Invalid credentials" });
//     }

//     if (!user.isVerified) {
//       return res
//         .status(401)
//         .json({ message: "Please verify your email before logging in" });
//     }

//     const token = jwt.sign(
//       { userId: user._id, role: user.role },
//       process.env.JWT_SECRET,
//       { expiresIn: "1h" }
//     );
//     res.json({ token });
//     console.log("User logged in successfully:", email);
//   } catch (error) {
//     console.error("Login error:", error);
//     res.status(500).json({ message: "Error logging in" });
//   }
// };

// exports.verifyEmail = async (req, res) => {
//   try {
//     const { token } = req.params;
//     const user = await User.findOne({ verificationToken: token });
//     if (!user) {
//       return res.status(400).json({ message: "Invalid verification token" });
//     }

//     user.isVerified = true;
//     user.verificationToken = undefined;
//     await user.save();

//     res.json({ message: "Email verified successfully. You can now log in." });
//     console.log("Email verified successfully for user:", user.email);
//   } catch (error) {
//     console.error("Email verification error:", error);
//     res.status(500).json({ message: "Error verifying email" });
//   }
// };


const jwt = require("jsonwebtoken");
const User = require("../models/User");
// const config = require("../config");
const nodemailer = require("nodemailer");

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Helper function to generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper function to send email
const sendEmail = async (to, subject, html) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
  });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    let user = await User.findOne({ $or: [{ email }, { name }] });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

    // Create new user
    user = new User({
      name,
      email,
      password,
      otp,
      otpExpires,
    });

    await user.save();

    // Send OTP email
    const otpEmailTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #333;">Verify Your Email</h2>
        <p>Your OTP for email verification is:</p>
        <h1 style="color: #4CAF50; font-size: 32px;">${otp}</h1>
        <p>This OTP will expire in 10 minutes.</p>
      </div>
    `;

    await sendEmail(email, "Email Verification OTP", otpEmailTemplate);

    res
      .status(201)
      .json({ message: "User registered. Please verify your email." });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error registering user", error: error.message });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { emailOrName, otp } = req.body; // Updated to accept email or name

    const user = await User.findOne({
      $or: [{ email: emailOrName }, { name: emailOrName }],
    }); // Updated query

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Send welcome email
    const welcomeEmailTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #333;">Welcome to Our Platform!</h2>
        <p>Thank you for verifying your email. We're excited to have you on board!</p>
        <p>You can now log in and start using our services.</p>
      </div>
    `;

    await sendEmail(email, "Welcome to Our Platform", welcomeEmailTemplate);

    res.json({ message: "Email verified successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error verifying OTP", error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { emailOrname, password } = req.body;

    const user = await User.findOne({
      $or: [{ email: emailOrname }, { name: emailOrname }],
    });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res
        .status(401)
        .json({ message: "Please verify your email before logging in" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      "18520cfcdd29fcbe11284ad3bd80b852d4eea55e84f2cc8fc69defd1ab7037a2526c923cde0f6ad91d5d8d04a8a66e04bc39df54df88d13e5c43b562fb08f342",
      {
        expiresIn: "12h",
      }
    );

    // Send token along with name, role, email, and expiry
    res.json({
      token,
      name: user.name,
      role: user.role,
      email: user.email,
      expiry: Date.now() + 12 * 3600000, // Token expiry set to 12 hours from now
    });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
};

// New function to resend OTP
exports.resendOTP = async (req, res) => {
  try {
    const { emailOrName } = req.body;

    const user = await User.findOne({
      $or: [{ email: emailOrName }, { name: emailOrName }],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send OTP email
    const otpEmailTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #333;">Verify Your Email</h2>
        <p>Your OTP for email verification is:</p>
        <h1 style="color: #4CAF50; font-size: 32px;">${otp}</h1>
        <p>This OTP will expire in 10 minutes.</p>
      </div>
    `;

    await sendEmail(user.email, "Email Verification OTP", otpEmailTemplate);

    res.json({ message: "New OTP sent to your email." });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error resending OTP", error: error.message });
  }
};

