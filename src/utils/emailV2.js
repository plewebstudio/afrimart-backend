const { Resend } = require("resend");
const {
  welcomeEmailTemplate,
  workerEmailTemplate,
  verifyEmailTemplate,
  changePasswordTemplate,
  resendVerifyEmailTemplate,
  resendChangePasswordTemplate,
} = require("../email-views/index");

async function sendEmail({ to, useCase, username, otp, message }) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const resend = new Resend(RESEND_API_KEY);

  const date = new Date();
  const monthDescription = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const year = date.getFullYear();
  const month = monthDescription[date.getMonth()];
  const day = date.getDate();
  const todayDate = `${day} ${month} ${year}`;

  let template;
  if (useCase == "Admin message") {
    template = workerEmailTemplate({ adminName, message });
  } else if (useCase == "Activate account") {
    template = verifyEmailTemplate({ otp, username, todayDate });
  } else if (useCase == "Forgot password") {
    template = changePasswordTemplate({ otp, username, todayDate });
  } else if (useCase == "Resend: Verify email") {
    template = resendVerifyEmailTemplate({ otp, username, todayDate });
  } else if (useCase == "Resend: Forgot password") {
    template = resendChangePasswordTemplate({ otp, username, todayDate });
  }

  //  await transporter.sendMail({
  //     from: '"Maddison Foo Koch 👻" <maddison53@ethereal.email>',
  //     to,
  //     subject: useCase,
  //     html: template
  //   });

  await resend.emails.send({
    from: "African Market <onboarding@resend.dev>",
    to,
    subject: useCase,
    html: template,
  });
}

module.exports = {
  sendEmail,
};
