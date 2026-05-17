const nodemailer = require("nodemailer");
const { db } = require("../../config/database");

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
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const data = await client.query(
        `SELECT * FROM queue WHERE tipe = 'email' AND status = 'pending' FOR UPDATE SKIP LOCKED LIMIT 1;`
    );
    if (data.rows.length === 0) {
        await client.query("COMMIT");
        // console.log("No email to send");
        return;
    }

    const row = data.rows[0];

    if (!row.destination) {
        console.error("Queue item has no destination email, marking as failed. Queue ID:", row.id);
        return;
    }

    try {
        const transporter = createTransporter();
        const info = await transporter.sendMail({
            from: `"Ginyuu" <${process.env.EMAIL_SENDER}>`,
            to: row.destination,
            subject: "Invoice has been created",
            html: row.pesan
        });

        await client.query(`UPDATE queue SET status = 'sent' WHERE id = $1`, [row.id]);
        await client.query("COMMIT");

        // console.log("Email terkirim:", info); 
        return info;
    } catch (sendError) {
        await client.query(`UPDATE queue SET status = 'failed' WHERE id = $1`, [row.id]);
        await client.query("COMMIT");
        throw sendError;
    }
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Gagal kirim email:", error);
    throw error;
  } finally {
    client.release();
  }
}

