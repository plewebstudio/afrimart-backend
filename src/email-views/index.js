const path = require("path");
const fs = require("fs");
const handlebars = require("handlebars");

const welcomeSource = fs.readFileSync(
  path.resolve(__dirname, "./welcome.handlebars"),
  "utf8"
);
const workerSource = fs.readFileSync(
  path.resolve(__dirname, "./worker.handlebars"),
  "utf8"
);

const verifySource = fs.readFileSync(
  path.resolve(__dirname, "./verify.handlebars"),
  "utf8"
);

const resendVerifySource = fs.readFileSync(
  path.resolve(__dirname, "./resend-verify.handlebars"),
  "utf8"
);
const changePasswordSource = fs.readFileSync(
  path.resolve(__dirname, "./change-password.handlebars"),
  "utf8"
);
const resendChangePasswordSource = fs.readFileSync(
  path.resolve(__dirname, "./resend-change-password.handlebars"),
  "utf8"
);

const welcomeEmailTemplate = handlebars.compile(welcomeSource);
const workerEmailTemplate = handlebars.compile(workerSource);
const verifyEmailTemplate = handlebars.compile(verifySource);
const resendVerifyEmailTemplate = handlebars.compile(resendVerifySource);
const changePasswordTemplate = handlebars.compile(changePasswordSource);
const resendChangePasswordTemplate = handlebars.compile(resendChangePasswordSource);

module.exports = {
  welcomeEmailTemplate,
  workerEmailTemplate,
  verifyEmailTemplate,
  changePasswordTemplate,
  resendVerifyEmailTemplate,
  resendChangePasswordTemplate
};
