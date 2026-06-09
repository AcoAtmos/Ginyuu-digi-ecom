const nodemailer = require("nodemailer");
const { db } = require("../../../db");
const { sql } = require("drizzle-orm");

const createTransporter = () => {
    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_SENDER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
};

exports.send_email = async (to, subject, html) => {
  try {
    const transporter = createTransporter();

    const info = await transporter.sendMail({
        from: `"Billing Digital" <${process.env.EMAIL_SENDER}>`,
        to: to,
        subject: subject,
        html: html
    });

    console.log("Email terkirim:", info);
    return info;
  } catch (error) {
    console.error("Gagal kirim email:", error);
    throw error;
  }
}

exports.send_email_worker = async () => {
  try {
    let sendError = null;
    const info = await db.transaction(async (tx) => {
      const data = await tx.execute(sql`
        SELECT * FROM queue WHERE tipe = 'email' AND status = 'pending' FOR UPDATE SKIP LOCKED LIMIT 1
      `);
      if (data.rows.length === 0) return;

      const row = data.rows[0];

      if (!row.destination) {
        console.error("Queue item has no destination email, marking as failed. Queue ID:", row.id);
        return;
      }

      try {
        const transporter = createTransporter();
        const mailInfo = await transporter.sendMail({
          from: `"Ginyuu" <${process.env.EMAIL_SENDER}>`,
          to: row.destination,
          subject: "Invoice has been created",
          html: row.pesan
        });

        await tx.execute(sql`UPDATE queue SET status = 'sent' WHERE id = ${row.id}`);
        return mailInfo;
      } catch (err) {
        sendError = err;
        await tx.execute(sql`UPDATE queue SET status = 'failed' WHERE id = ${row.id}`);
      }
    });

    if (sendError) throw sendError;
    return info;
  } catch (error) {
    console.error("Gagal kirim email:", error);
    throw error;
  }
}

