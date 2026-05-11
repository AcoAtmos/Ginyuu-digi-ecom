const nodemailer = require("nodemailer");
const { ImapFlow } = require("imapflow");
const { db } = require("../../config/database");

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

const IMAP_USER = process.env.IMAP_USER || '';
const IMAP_PASS = process.env.IMAP_PASS || '';
const IMAP_HOST = process.env.IMAP_HOST || 'login.masuk.email';
const IMAP_PORT = parseInt(process.env.IMAP_PORT || '993', 10);
const EMAIL_SENDER = process.env.EMAIL_SENDER || process.env.IMAP_USER || '';
const GMAIL_APP_PASS = process.env.GMAIL_APP_PASS || '';
const EMAIL_FILTER = 'noreply@bni.co.id';

console.log('[email.js] IMAP config:', { host: IMAP_HOST, port: IMAP_PORT, user: IMAP_USER, pass: IMAP_PASS ? 'SET' : 'EMPTY' });
console.log('[email.js] GMAIL config:', { sender: EMAIL_SENDER, gmail_pass: GMAIL_APP_PASS ? 'SET' : 'EMPTY' });

let idleClient = null;
let isIdleRunning = false;
let idleLock = null;

exports.checkEmail = async () => {
    const log = 'email.js > checkEmail';
    if (isIdleRunning) {
        console.log('[' + log + '] already running');
        return;
    }
    isIdleRunning = true;
    console.log('[' + log + '] starting IMAP IDLE...');

    const connectAndIdle = async () => {
        try {
            idleClient = new ImapFlow({
                host: IMAP_HOST,
                port: IMAP_PORT,
                secure: true,
                auth: {
                    user: IMAP_USER,
                    pass: IMAP_PASS,
                },
            });
            
            await idleClient.connect();
            console.log('[' + log + '] connected to IMAP');

            idleLock = await idleClient.getMailboxLock('INBOX');
            const mailbox = idleClient.mailbox;
            console.log('[' + log + '] inbox has ' + (mailbox ? mailbox.exists : 0) + ' messages, watching for new emails...');

            idleClient.on('close', () => {
                console.log('[' + log + '] connection closed, reconnecting in 10s...');
                isIdleRunning = false;
                idleLock = null;
                setTimeout(connectAndIdle, 10000);
            });

            while (isIdleRunning && idleClient) {
                try {
                    await idleClient.idle();
                } catch (idleErr) {
                    console.error('[' + log + '] idle error:', idleErr.message);
                    break;
                }

                if (isIdleRunning && idleClient) {
                    const mailbox = idleClient.mailbox;
                    const currentExists = mailbox ? mailbox.exists : 0;
                    console.log('[' + log + '] IDLE triggered, inbox has ' + currentExists + ' messages');

                    if (currentExists > 0) {
                        const newMessages = await idleClient.fetchAll(
                            currentExists + ':*',
                            { envelope: true, bodyStructure: true, source: true }
                        );
                        
                        console.log('[' + log + '] fetched ' + newMessages.length + ' new messages');

                        for (const msg of newMessages) {
                            try {
                                console.log('[' + log + '] processing msg uid=' + msg.uid);
                                const envelope = msg.envelope;
                                if (!envelope) continue;
                                
                                const from = envelope.from ? envelope.from[0] : null;
                                if (!from) continue;
                                
                                const fromAddress = from.address || '';
                                const subject = envelope.subject || '';
                                console.log('[' + log + '] new email from: ' + fromAddress + ', subject: ' + subject);
                                
                                console.log('[' + log + '] checking existing for uid=' + msg.uid);
                                const existingCheck = await db.query(
                                    'SELECT id FROM email_inbox WHERE message_id=$1 LIMIT 1',
                                    [msg.uid.toString()]
                                );

                                if (existingCheck.rows.length > 0) {
                                    console.log('[' + log + '] already exists, skipping');
                                    continue;
                                }
                                console.log('[' + log + '] not in db yet, proceeding');

                                let bodyText = '';
                                let bodyHtml = '';

                                if (msg.source) {
                                    const sourceStr = msg.source.toString();
                                    const textMatch = sourceStr.match(/Content-Type: text\/plain[^]*?\r?\n\r?\n([^]*?)(?=\r?\n--|$)/i);
                                    const htmlMatch = sourceStr.match(/Content-Type: text\/html[^]*?\r?\n\r?\n([^]*?)(?=\r?\n--|$)/i);
                                    bodyText = textMatch ? textMatch[1].trim() : '';
                                    bodyHtml = htmlMatch ? htmlMatch[1].trim() : '';
                                }
                                
                                console.log('[' + log + '] body fetch complete: text=' + bodyText.length + ', html=' + bodyHtml.length);

                                if (fromAddress.toLowerCase() === 'noreply@bni.co.id' && subject.includes('BNI Merchant - ')) {
                                    const nominalMatch = subject.match(/Rp\s?([\d,.]+)/);
                                    if (nominalMatch) {
                                        const nominal = parseInt(nominalMatch[1].replace(/,/g, ''), 10);
                                        console.log('[' + log + '] detected payment nominal: ' + nominal);

                                        const threeDaysAgo = new Date();
                                        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
                                        
                                        const orders = await db.query(
                                            `SELECT 
                                                i.id AS invoice_id, 
                                                i.order_id,
                                                o.user_id 
                                            FROM invoices i
                                            INNER JOIN orders o ON o.id = i.order_id
                                            WHERE i.total=$1 
                                              AND i.expires_at>=$2 
                                              AND i.status_payment='unpaid' 
                                            ORDER BY i.expires_at DESC 
                                            LIMIT 1`,
                                            [nominal, threeDaysAgo.toISOString()]
                                        );

                                        if (orders.rows.length > 0) {
                                            const invoiceId = orders.rows[0].invoice_id;
                                            const orderId = orders.rows[0].order_id;
                                            const pelangganId = orders.rows[0].user_id;
                                            
                                            await db.query(
                                                `UPDATE orders SET status='completed' WHERE id=$1`,
                                                [orderId]
                                            );
                                            
                                            await db.query(
                                                `UPDATE invoices SET status_payment='paid' WHERE id=$1`,
                                                [invoiceId]
                                            );
                                            
                                            console.log('[' + log + '] order ' + orderId + ' marked as completed, invoice ' + invoiceId + ' marked as paid for nominal ' + nominal);
                                            
                                            const userRows = await db.query(
                                                `SELECT username, phone, email FROM users WHERE id=$1`,
                                                [pelangganId]
                                            );

                                            if (userRows.rows.length > 0) {
                                                const user = userRows.rows[0];
                                                const userName = String(user.username || '');
                                                const userPhone = String(user.phone || '');
                                                const userEmail = String(user.email || '');
                                                const memberUrl = process.env.BASE_URL_MEMBER || 'http://member.billing.local';
                                                
                                                const waBody = 'Halo ' + userName + ', pembayaran Anda telah berhasil! ✅\n\nBerikut langkah selanjutnya:\nSilakan masuk ke portal member area ' + memberUrl + ' dengan akun Anda untuk mendapatkan layanan atau produk yang dibeli.\n\nTerima kasih telah bertransaksi bersama kami!';
                                                
                                                const emailSubject = 'Pembayaran Berhasil - Selamat datang di Member Area';
                                                const emailBody = '<p>Halo ' + userName + ',</p><p>pembayaran Anda telah berhasil! ✅</p><p>Berikut langkah selanjutnya:</p><p>Silakan masuk ke portal <a href="' + memberUrl + '">Member Area</a> dengan akun Anda untuk mendapatkan layanan atau produk yang dibeli.</p><p>Terima kasih telah bertransaksi bersama kami!</p>';
                                                
                                                try {
                                                    if (userPhone) {
                                                        const { sendWhatsApp } = require('./whatsapp.service');
                                                        await sendWhatsApp(userPhone, waBody);
                                                        console.log('[' + log + '] WA sent to ' + userPhone);
                                                    }
                                                } catch (waErr) {
                                                    console.error('[' + log + '] WA send error:', waErr.message);
                                                }
                                                
                                                try {
                                                    if (userEmail) {
                                                        await exports.send_email(userEmail, emailSubject, emailBody);
                                                        console.log('[' + log + '] Email sent to ' + userEmail);
                                                    }
                                                } catch (emailErr) {
                                                    console.error('[' + log + '] Email send error:', emailErr.message);
                                                }
                                            }
                                        } else {
                                            console.log('[' + log + '] no matching order found for nominal ' + nominal);
                                        }
                                    }
                                }

                                console.log('[' + log + '] inserting to db: uid=' + msg.uid + ', subject=' + subject);

                                try {
                                    await db.query(
                                        `INSERT INTO email_inbox (message_id, subject, from_address, from_name, to_address, date, body_text, body_html)
                                         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
                                        [
                                            msg.uid.toString(),
                                            envelope.subject || '',
                                            fromAddress,
                                            from.name || '',
                                            envelope.to ? envelope.to[0].address : '',
                                            envelope.date || new Date(),
                                            bodyText.substring(0, 10000),
                                            bodyHtml.substring(0, 50000)
                                        ]
                                    );
                                    console.log('[' + log + '] saved real-time email: ' + envelope.subject);
                                } catch (dbErr) {
                                    console.error('[' + log + '] db insert error:', dbErr.message);
                                }
                            } catch (err) {
                                console.error('[' + log + '] error processing new email:', err.message);
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error('[' + log + '] connection error:', error.message);
            isIdleRunning = false;
            idleLock = null;
            setTimeout(connectAndIdle, 30000);
        }
    };

    connectAndIdle();
}
