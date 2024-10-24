const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const SMTPConnection = require("nodemailer/lib/smtp-connection");
dotenv.config();

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REFRESH_TOKEN,
  MAIL_USERNAME,
  MAIL_PASSWORD,
} = process.env;

let auth = {
  type: "OAuth2",
  user: MAIL_USERNAME,
  pass: MAIL_PASSWORD,
  clientId: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  refreshToken: GOOGLE_REFRESH_TOKEN,
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: auth,
});

module.exports = transporter;
