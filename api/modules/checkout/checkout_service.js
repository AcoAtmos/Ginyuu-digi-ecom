
const {db} = require("../../common/helper");
const bcrypt = require("bcrypt");
// ============= CHECKOUT PROCESS =============
exports.capturePayload = async (data) =>{
    let username = data?.username;
    let email = data?.email;
    let password = data?.password || null;
    let phone = data?.phone;
    let payment_method = data?.payment_method;
    let productId = data?.productId;
    let amount = data?.amount;
    let discount = data?.discount;
    let terms = data?.terms;

    let result = {
        payload : {
            username : username,
            email : email,
            password : password || null,
            phone : phone,
            payment_method : payment_method,
            productId : productId,
            amount : amount || 1,
            discount : discount || 0,
            terms : terms || true
        },
        code : 200,
        status : "success",
        message : "Success",
        data : {}

    }
    return result;
}

exports.validatePayload = async (result) =>{
    // check if payload is valid
    if (result.status !== "success"){
        result.message = "Invalid payload";
        result.code = 400;
        result.status = "failed";
        console.log ("Invalid payload");
    }

    // check if username is valid
    if (result.payload.username === "" || result.payload.username === null || result.payload.username === undefined){
        result.message = "Username is required";
        result.code = 400;
        result.status = "failed";
        console.log ("Username is required");
    }

    // check if email is valid
    if (result.payload.email === "" || result.payload.email === null || result.payload.email === undefined){
        result.message = "Email is required";
        result.code = 400;
        result.status = "failed";
        console.log ("Email is required");
    } 
    
    // check if phone is valid
    if (result.payload.phone === "" || result.payload.phone === null || result.payload.phone === undefined){
        result.message = "Phone is required";
        result.code = 400;
        result.status = "failed";
        console.log ("Phone is required");
    }
    
    // check if payment method is valid
    if (result.payload.payment_method === "" || result.payload.payment_method === null || result.payload.payment_method === undefined){
        result.message = "Payment method is required";
        result.code = 400;
        result.status = "failed";
        console.log ("Payment method is required");
    }
    
    // check if product is valid
    if (result.payload.productId === "" || result.payload.productId === null || result.payload.productId === undefined){
        result.message = "Product is required";
        result.code = 400;
        result.status = "failed";
        console.log ("Product is required");
    }
    
    // check if terms is valid
    if (result.payload.terms == false){
        result.message = "Terms and conditions must be accepted";
        result.code = 400;
        result.status = "failed";
        console.log ("Terms and conditions must be accepted");
    }
    return result;
}
exports.getPrice = async (result) => {
    if (result.status == 'failed') { return result; }
    console.log(result.payload.productId);
    try{
        const queryResult = await db.query("SELECT price FROM products WHERE id = $1", [result.payload.productId]);
        if (queryResult.rows.length == 0 ){
            result.message = "Product not found";
            result.code = 400;
            result.status = "failed";
            console.log("Product not found");
            return result;
        }
        result.payload.price = queryResult.rows[0].price;
    }catch(err){
        result.message = "Get price failed";
        result.code = 400;
        result.status = "failed";
        console.log("Get price failed");
        console.log(err);
    }
    return result;
}
exports.countTotal = async (result) => {
    if (result.status == 'failed') { return result; }
    try{
        let total = result.payload.price * result.payload.amount;
        result.payload.total = parseInt(total);
    }catch(err){
        result.message = "Count total failed";
        result.code = 400;
        result.status = "failed";
        console.log("Count total failed");
    }
    return result;
}

// ============= Begin ==============
exports.checkout_add_user = async (result) => {
  if (result.status === "failed") return result;

  try {
    const userResult = await db.query(
      "SELECT id FROM users WHERE email = $1",
      [result.payload.email]
    );

    // user belum ada
    if (userResult.rows.length === 0) {

      if (!result.payload.password) {
        result.status = "failed";
        result.code = 400;
        result.message = "Password is required";
        console.log("Password is required");
        return result;
      }
      const hashedPassword = await bcrypt.hash(result.payload.password, 10);
      const insertResult = await db.query(
        `INSERT INTO users (email, phone, username, password, terms)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [
          result.payload.email,
          result.payload.phone,
          result.payload.username,
          hashedPassword,
          result.payload.terms
        ]
      );

      result.payload.idUser = insertResult.rows[0].id;

    } else {
      // user sudah ada
      result.payload.idUser = userResult.rows[0].id;
    }

    result.status = "success";
    result.code = 200;
    result.message = "Success";
    return result;

  } catch (err) {
    console.error(err)
  }
};

exports.checkout_create_order = async (result) => {
    if (result.status == 'failed') { return result; }
    try {
        const orderResult = await db.query(
            `INSERT INTO orders 
            (   
                user_id,
                product_id, 
                amount, 
                total_price, 
                payment_method
                )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id `,
            [
                result.payload.idUser,
                result.payload.productId,
                result.payload.amount,
                result.payload.total,
                result.payload.payment_method
            ]
        );
        
        console.log(orderResult);
        result.payload.idOrder = orderResult.rows[0].id;
        result.status = "success";
        result.code = 200;
        result.message = "Success";
        return result;
    } catch (err) {
        result.status = "failed";
        result.code = 500;
        result.message = "Create order failed";
        console.log("create order failed");
        console.log(err);
        return result
    }
}

exports.checkout_create_invoice = async (result) => {
    if (result.status == 'failed') { return result; }
    try {
        const invoice_number = "INV-" + Date.now() + result.payload.idUser + "-" + result.payload.idOrder;
        const issued_at = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
        const invoiceResult = await db.query(
            `INSERT INTO invoices (
                order_id, 
                invoice_number,
                discount_amount,
                final_amount, 
                issued_at
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id `,
            [
                result.payload.idOrder,
                invoice_number,
                result.payload.discount,
                result.payload.total,
                issued_at // jatuh tempo
            ]
        );
        
        console.log(invoiceResult);
        result.payload.idInvoice = invoiceResult.rows[0].id;
        result.status = "success";
        result.code = 200;
        result.message = "Success";
        return result;
    } catch (err) {
        result.status = "failed";
        result.code = 500;
        result.message = "Create invoice failed";
        console.log("create invoice failed");
        console.log(err);
        return result
    }
}

exports.checkout_add_queue = async (result) => {
    if (result.status == 'failed') { return result; }

    try {

        let messageWA = `Halo ${result.payload.username}, terima kasih telah melakukan pembelian.

        Produk: ${result.payload.productId}
        Harga: ${result.payload.price}
        Total: ${result.payload.total}

        Silahkan lakukan pembayaran ke rekening berikut:
        Bank: BCA
        No. Rekening: 1234567890
        Atas Nama: PT. Billing Digital Indonesia

        Setelah melakukan pembayaran, silahkan konfirmasi ke nomor WhatsApp berikut: 0000000000

        Terima kasih.`;

        let messageEmail = `
        <p>Halo ${result.payload.username}, terima kasih telah melakukan pembelian.</p>
        <p>Produk: ${result.payload.productId}</p>
        <p>Harga: ${result.payload.price}</p>
        <p>Total: ${result.payload.total}</p>
        <p>Silahkan lakukan pembayaran ke rekening berikut:</p>
        <p>Bank: BCA</p>
        <p>No. Rekening: 1234567890</p>
        <p>Atas Nama: PT. Billing Digital Indonesia</p>
        <p>Setelah melakukan pembayaran, silahkan konfirmasi ke nomor WhatsApp berikut: 0000000000</p>
        <p>Terima kasih.</p>`;

        // INSERT WHATSAPP
        const queueResultWA = await db.query(
            `INSERT INTO queue (
                order_id,
                destination,
                tipe,
                pesan,
                status,
                created_at
            )
            VALUES ($1, $2, $3, $4, $5, NOW())
            RETURNING id`,
            [
                result.payload.idOrder,
                result.payload.phone,
                "whatsapp",
                messageWA,
                "pending"
            ]
        );

        // INSERT EMAIL
        const queueResultEmail = await db.query(
            `INSERT INTO queue (
                order_id,
                destination,
                tipe,
                pesan,
                status,
                created_at
            )
            VALUES ($1, $2, $3, $4, $5, NOW())
            RETURNING id`,
            [
                result.payload.idOrder,
                result.payload.email,
                "email",
                messageEmail,
                "pending"
            ]
        );

        result.payload.idQueueWA = queueResultWA.rows[0].id;
        result.payload.idQueueEmail = queueResultEmail.rows[0].id;

        result.status = "success";
        result.code = 200;
        result.message = "Success";
        return result;

    } catch (err) {
        result.status = "failed";
        result.code = 500;
        result.message = "Create queue failed";
        console.log(err);
        return result;
    }
};

exports.checkout_send_whatsapp = async ()=>{
    try{
        const data = await db.query(
            `SELECT * FROM queue WHERE tipe = 'whatsapp' AND status = 'pending'`
        );
        if (data.rows.length == 0) {
            console.log("No whatsapp to send");
            return;
        }
        const {send_whatsapp} = require("../whatsapp/whatsapp_service");
        await send_whatsapp(data.rows[0].destination, data.rows[0].pesan);
    }catch(err){
       throw new Error(err);
    }
    return;
}

exports.checkout_send_email = async ()=>{
    try{
        const data = await db.query(
            `SELECT * FROM queue WHERE tipe = 'email' AND status = 'pending'`
        );
        if (data.rows.length == 0) {
            console.log("No email to send");
            return;
        }
        const {send_email} = require("../email/email_service");
        await send_email(data.rows[0].destination, "Invoice berhasil dibuat", data.rows[0].pesan);
    }catch(err){
        throw new Error(err);
    }
    return;
}
// ============= Commit ==============
exports.createResponse =async (result) =>{
    let res = {
        payload : result.payload,
        code : result.code,
        status : result.status,
        message : result.message,
        data : result
    }
    return res;
}