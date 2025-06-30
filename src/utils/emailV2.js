const nodemailer = require("nodemailer");
const {
  welcomeEmailTemplate,
  workerEmailTemplate,
  verifyEmailTemplate,
  changePasswordTemplate,
  resendVerifyEmailTemplate,
  resendChangePasswordTemplate,
} = require("../email-views/index");

async function sendEmail({ to, useCase, username, otp, message }) {
  // const transporter = nodemailer.createTransport({
  //   host: "sandbox.smtp.mailtrap.io",
  //   port: 2525,
  //   auth: {
  //     user: "06414813769737",
  //     pass:"5ae0e821a75f4b"
  //   }
  //   });

  const RESEND_API_KEY = "re_8iabRGgg_Huk1YXJ6BWu95BkQt5WkF4Bw";
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
  } else if (useCase == "Change password") {
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
    to: userEmail,
    subject,
    html: emailHtml,
  });
}

module.exports = {
  sendEmail,
};
