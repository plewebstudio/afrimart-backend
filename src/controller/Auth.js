const { User } = require("../model/User");
const { Readable } = require("stream");
const cloudinary = require("cloudinary").v2;
const bcrypt = require("bcryptjs");
//const { sendEmail } = require("../utils/email");
const { sendEmail } = require("../utils/emailV2.js");
const crypto = require("crypto");

cloudinary.config({
  cloud_name: process.env.cloudinary_name,
  api_key: process.env.cloudinary_api_key,
  api_secret: process.env.cloudinary_api_secret,
});

// exports.Register = async (req, res) => {
//   const user = await User.create(req.body);

//   const confirmEmailToken = user.generateEmailConfirmationToken();
//   await user.save({ validateBeforeSave: false });

//   console.log({
//     to: user.email,
//     username: user.username,
//     useCase: "Activate account",
//     otp: confirmEmailToken,
//   });

//   try {
//     const email = await sendEmail({
//       to: user.email,
//       username: user.username,
//       useCase: "Activate account",
//       otp: confirmEmailToken,
//     });

//     console.log(email);
//   } catch (error) {
//     console.error("Email sending error:", error);
//     return res
//       .status(500)
//       .json({ message: "Something went wrong while sending emails" });
//   }

//   responseToken(user, 201, res, "register");
// };

exports.Register = async (req, res) => {
  try {
    const user = await User.create(req.body);

    const confirmEmailToken = user.generateEmailConfirmationToken();
    await user.save({ validateBeforeSave: false });

    console.log({
      to: user.email,
      username: user.username,
      useCase: "Activate account",
      otp: confirmEmailToken,
    });

    try {
      const email = await sendEmail({
        to: user.email,
        username: user.username,
        useCase: "Activate account",
        otp: confirmEmailToken,
      });

      console.log(email);
    } catch (error) {
      console.error("Email sending error:", error);
      return res.status(500).json({
        message: "Something went wrong while sending the confirmation email.",
      });
    }

    responseToken(user, 201, res, "register");
  } catch (err) {
    console.error("Registration error:", err);

    // Handle duplicate key errors (MongoDB specific)
    if (err.code === 11000) {
      const duplicatedField = Object.keys(err.keyPattern)[0]; // "email" or "username"
      return res.status(400).json({
        message: `${duplicatedField} already exists. Please choose another.`,
      });
    }

    // Handle validation errors (optional)
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(", ") });
    }

    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.confirmEmail = async (req, res, next) => {
  //grab token from email
  console.log(req.body);

  const { token } = req.body;
  console.log(`query token: ${token}`);

  if (!token) {
    return res.status(401).json({ message: "Invalid token" });
  }

  const confirmEmailToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  console.log(`ConfirmEmail: ${confirmEmailToken}`);

  //get user by token
  const user = await User.findOne({
    confirmEmailToken,
    //confirmEmailExpire: { $gt: Date.now() },
    isEmailConfirmed: false,
  });

  if (!user) {
    return res.status(404).json({ message: "No user found with this token" });
  }

  //update confirmed to true
  user.confirmEmailToken = undefined;
  user.isEmailConfirmed = true;
  user.confirmEmailExpire = undefined;

  //save
  user.save({ validateBeforeSave: false });

  //return token
  responseToken(user, 200, res);
};

exports.Login = async (req, res, next) => {
  const { usernameOrEmail, password } = req.body;
  if (!usernameOrEmail || !password) {
    return next(`Please fill in the empty field(s)`);
  }

  let user;
  if (usernameOrEmail.includes("@")) {
    user = await User.findOne({ email: usernameOrEmail }).select("+password");
  } else {
    user = await User.findOne({ username: usernameOrEmail }).select(
      "+password"
    );
  }

  if (!user) {
    return next(`No account found with this email`);
  }

  console.log(user);
  const iMatch = await user.matchPassword(password);
  if (!iMatch) {
    return next(`Wrong password. Check and try again`);
  }

  responseToken(user, 200, res, "login");
};

exports.loggedInUser = async (req, res, next) => {
  console.log("Hello world");
  res.status(200).json({ success: true, user: req.user });
};

// controllers/userController.js

exports.forgotPassword = async (req, res, next) => {
  //get user
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return res.status(401).json({
      message: `Email does not match. Provide the one associated with this account`,
    });
  }

  //get token
  const token = await user.getPasswordResetToken();
  const encodedToken = encodeURIComponent(token);
  await user.save({ validateBeforeSave: false });
  const confirmEmailURL = `https://africanmarkets.eu/change-password.html?token=${encodedToken}`;

  try {
    await sendEmail({
      to: user.email,
      useCase: "Forgot password",
      username: user.username,
      otp: confirmEmailURL,
    });

    return res.status(200).json({ success: true, data: "Email sent" });
  } catch (err) {
    console.log(err);

    //return resetpassword token and expiring date to undefined. to avoid security breach
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });
    return res.status(401).json({ message: "Something went wrong" });
  }
};

exports.resetPassword = async (req, res, next) => {
  //get reset token
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.body.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  }).select("+password");

  if (!user) {
    return res.status(401).json({ message: `Invalid token` });
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  responseToken(user, 200, res);
};

exports.updateProfilePicture = async (req, res) => {
  try {
    // Ensure a file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: "No file found" });
    }

    // Assuming your auth middleware has set req.user.id
    const userId = req.user.id;
    const image = req.file; // Multer will place the uploaded file here

    // Function to upload the file buffer to Cloudinary via a stream
    const streamUpload = (fileBuffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "users/profile" }, // Optional: specify a folder in Cloudinary
          (error, result) => {
            if (error) {
              return reject(error);
            }
            resolve(result);
          }
        );

        // Convert the buffer to a readable stream and pipe it to Cloudinary
        const bufferStream = new Readable();
        bufferStream.push(fileBuffer);
        bufferStream.push(null); // Indicate the end of the stream
        bufferStream.pipe(stream);
      });
    };

    // Upload the image and get the result from Cloudinary
    const result = await streamUpload(image.buffer);

    // Update the user's profile picture in the database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePicture: result.secure_url },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Optionally, you can also update the localStorage on the client-side after a successful response.
    res.status(200).json({
      message: "Profile picture updated successfully",
      data: updatedUser,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error updating profile picture" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    // Assuming your authentication middleware sets req.user.id
    const userId = req.user.id;
    // Destructure the new username field along with the other fields
    const { username, firstName, lastName, email, password } = req.body;

    // Find the user document
    let user = await User.findById(userId).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If a new username is provided, update it; otherwise, update based on first/last name if provided
    if (username) {
      user.username = username;
    } else if (firstName || lastName) {
      const updatedUsername = `${firstName || ""} ${lastName || ""}`.trim();
      if (updatedUsername) {
        user.username = updatedUsername;
      }
    }

    // Update email if provided
    if (email) {
      user.email = email;
    }

    // Update password if provided; the pre-save hook will hash it
    if (password) {
      user.password = password;
    }

    // Save the updated user document
    await user.save();

    // Remove sensitive fields before returning
    const userData = user.toObject();
    delete userData.password;

    res.status(200).json({
      message: "Profile updated successfully",
      data: userData,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.resendToken = async (req, res) => {
  const { tokenType, email } = req.body;

  if (!email || !tokenType) {
    return res.status(400).json({
      errors: [
        {
          field: "confirm token",
          message: "Something went wrong. Please provide email and token type.",
        },
      ],
    });
  }

  try {
    // Find the user (here we ignore googleAcct for simplicity)
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        errors: [
          {
            field: "resend token",
            message: "Token sent to the specified email.",
          },
        ],
      });
    }

    if (tokenType === "confirm email") {
      // If the user is already verified, no need to resend confirmation
      if (user.isEmailConfirmed) {
        return res.status(400).json({
          errors: [
            {
              field: "resend token",
              message: "Token sent to the specified email.",
            },
          ],
        });
      }

      // Generate a new email confirmation token using the model method.
      const confirmEmailToken = user.generateEmailConfirmationToken();
      // Save user without running validations
      await user.save({ validateBeforeSave: false });

      await sendEmail({
        to: user.email,
        useCase: "Resend: Activate account",
        username: user.username,
        otp: confirmEmailToken,
      });
    } else if (tokenType === "forgot password") {
      const resetToken = await user.getPasswordResetToken();
      const encodedToken = encodeURIComponent(resetToken);
      await user.save({ validateBeforeSave: false });
      const confirmEmailURL = `https://africanmarkets.eu/change-password.html?token=${encodedToken}`;

      await sendEmail({
        to: user.email,
        useCase: "Resend: Forgot password",
        username: user.username,
        otp: confirmEmailURL,
      });
    } else {
      // Unknown token type
      return res.status(400).json({
        errors: [
          {
            field: "resend token",
            message: "Invalid token type specified.",
          },
        ],
      });
    }

    return res.json({ message: "Token sent to the specified email." });
  } catch (error) {
    console.error("Resend token error:", error);
    return res.status(500).json({
      errors: [
        {
          field: "server",
          message: error.message,
        },
      ],
    });
  }
};

const responseToken = async (user, statusCode, res, type) => {
  //create token
  const token = user.getSignedInJwtToken();

  //jwt options
  const options = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: false,
  };

  //send the response
  res
    .status(statusCode)
    .cookie("token", token, options)
    .json({ success: true, token, user });
};
