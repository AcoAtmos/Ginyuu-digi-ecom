const nodemailer = require("nodemailer");

exports.send_email = async (to, subject, html) => {
  try {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            user: process.env.EMAIL_SENDER,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    const info = await transporter.sendMail({
        from: `"Billing Digital" <${process.env.EMAIL_SENDER}>`,
        to: to,
        subject: subject,
        html: html
    });

    console.log("Email terkirim:", info);
    console.log("Email :", process.env.EMAIL_SENDER);
    console.log("Password :", process.env.EMAIL_PASSWORD);
    return info;
  } catch (error) {
    console.error("Gagal kirim email:", error);
    throw error;
  }
}
