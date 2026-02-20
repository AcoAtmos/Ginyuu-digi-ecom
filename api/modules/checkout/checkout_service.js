
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

// ============= Begin  ==============
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

exports.checkout_send_whatsapp = async (result)=>{
    if (result.status == 'failed') { return result; }
    result.payload.message = `Halo ${result.payload.username}, terima kasih telah melakukan pembelian. Berikut adalah detail pembelian Anda:
    
    Produk: ${result.payload.productId}
    Harga: ${result.payload.price}
    Total: ${result.payload.total}
    
    Silahkan lakukan pembayaran ke rekening berikut:
    Bank: BCA
    No. Rekening: 1234567890
    Atas Nama: PT. Billing Digital Indonesia
    
    Setelah melakukan pembayaran, silahkan konfirmasi ke nomor WhatsApp berikut: 0000000000
    
    Terima kasih.`;
    try{
        const {send_whatsapp} = require("../whatsapp/whatsapp_service");
        result = await send_whatsapp(result);
        result.message = "Send whatsapp success";
        result.code = 200;
        result.status = "success";
    }catch(err){
        result.message = "Send whatsapp failed";
        result.code = 400;
        result.status = "fail";
        console.log("send whatsapp failed");
    }
    return result;
}


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