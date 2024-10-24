const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();
const bcrypt = require("bcrypt");
const { body, validationResult } = require("express-validator");
const authUser = require("../middleware/authUser");
const dotenv = require("dotenv");
const { deleteAllUserData } = require("../controller/deleteUser");
const transporter = require("../utilities/mailer.config");
dotenv.config();

// create a user :post "/auth",!auth
let success = false;

router.post(
  "/verifyCode",
  [
    body("email", "Enter a valid email").isEmail(),
    body("code", "Invalide code")
      .notEmpty()
      .isNumeric()
      .isLength({ min: 4, max: 4 }),
  ],
  async (req, res) => {
    const { email, code } = req.body;

    // Find user with this email and verify the code
    let user = await User.findOne({ email: email });

    if (user.verificationCode !== Number(code)) {
      res.status(400).send({ success, message: "Invalid code" });
    } else {
      success = true;
      res.status(200).send({ success, message: "Verification successfull" });
    }
  }
);

router.post(
  "/register",
  [
    body("firstName", "Enter a valid name").isLength({ min: 1 }),
    body("lastName", "Enter a valid name").isLength({ min: 1 }),
    body("email", "Enter a valid email").isEmail(),
    body("password", "Password must be at least 5 characters").isLength({
      min: 5,
    }),
    body("phoneNumber", "Enter a valid phone number").isLength({
      min: 11,
      max: 12,
    }),
  ],
  async (req, res) => {
    // res.c
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array() });
    }
    const { firstName, lastName, email, phoneNumber, password, isAdmin } =
      req.body;
    const verificationCode = Math.floor(Math.random() * (9999 - 1000) + 1000);

    try {
      let user = await User.findOne({
        $or: [{ email: email }, { phoneNumber: phoneNumber }],
      });
      if (user) {
        return res.status(400).send({ error: "Sorry a user already exists" });
      }

      // password hashing
      const salt = await bcrypt.genSalt(10);
      const secPass = await bcrypt.hash(password, salt);

      // create a new user
      user = await User.create({
        firstName,
        lastName,
        email,
        phoneNumber,
        password: secPass,
        verificationCode,
        isAdmin,
      });
      const data = {
        user: {
          id: user.id,
        },
      };
      success = true;
      const authToken = jwt.sign(data, process.env.JWT_SECRET);

      // Send email to User after signup
      transporter.sendMail(
        {
          from: "",
          to: email,
          subject: "Welcome to Shopit",
          text: `Hello ${firstName}, welcome to Shopit, your verification code is ${verificationCode}`,
        },
        (err) => {
          if (err) {
            throw err;
          }
        }
      );
      res.send({ success, authToken });
    } catch (error) {
      res.status(500).send("Internal server error");
    }
  }
);

// login Route
router.post(
  "/login",
  [
    body("email", "Enter a valid email").isEmail(),
    body("password", "Password cannot be blank").exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array() });
    }

    const { email, password } = req.body;
    const verificationCode = Math.floor(Math.random() * (9999 - 1000) + 1000);

    try {
      let user = await User.findOne({ email });
      if (!user) {
        return res.status(400).send({ success, error: "User not found" });
      }
      const passComp = await bcrypt.compare(password, user.password);
      if (!passComp) {
        return res.status(400).send({
          success,
          error: "Please try to login with correct credentials",
        });
      }

      user.verificationCode = verificationCode;
      await user.save();

      const data = {
        user: {
          id: user._id,
        },
      };

      const authToken = jwt.sign(data, process.env.JWT_SECRET);
      success = true;

      // Send email to User after login
      transporter.sendMail(
        {
          from: "",
          to: email,
          subject: "Welcome to Shopit",
          text: `Hello ${user.firstName}, welcome back to Shopit, your verification code is ${verificationCode}`,
        },
        (err) => {
          if (err) {
            throw err;
          }
        }
      );
      res.send({ success, authToken });
    } catch (error) {
      res.status(500).send("Internal server error002");
    }
  }
);
// logged in user details

router.get("/getuser", authUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    success = true;
    res.send(user);
    console.log(user.city);
  } catch (error) {
    res.status(400).send("Something went wrong");
  }
});

// update user details
router.put("/updateuser", authUser, async (req, res) => {
  const { userDetails } = req.body;
  let convertData = JSON.parse(userDetails);
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      let updateDetails = await User.findByIdAndUpdate(req.user.id, {
        $set: convertData,
      });
      success = true;
      res.status(200).send({ success });
    } else {
      return res.status(400).send("User Not Found");
    }
  } catch (error) {
    res.send("Something went wrong");
  }
});

// delete user and user data
router.delete("/delete/user/:userId", authUser, deleteAllUserData);
module.exports = router;
