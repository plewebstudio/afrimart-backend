const { sendEmail } = require("../utils/email");

exports.AdminReview = async (req, res) => {
  const { email } = req.user;
  const { message } = req.body;

  try {
    await sendEmail("africanmarketlithuania@gmail.com", "Admin message", email, message);
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }

  res.status(200).json({ message: "Message sent" });
};
