
const {db} = require("../../common/helper")
// ============= CHECKOUT PROCESS =============
exports.capturePayload = async (data) =>{
    let username = data?.username;
    let email = data?.email;
    let password = data?.password;
    let phone = data?.phone;
    let payment_method = data?.payment_method;
    let product = data?.product;
    let amount = data?.amount;
    let discount = data?.discount;

    let dt = {
        payload : {
            username : username,
            email : email,
            password : password,
            phone : phone,
            payment_method : payment_method,
            product : product,
            amount : amount,
            discount : discount
        },
        code : 200,
        status : "success",
        message : "Success",
        data : {}

    }
    return dt;
}
exports.validatePayload = async (result) =>{
    if (result.status !== "success"){
        throw new Error("Invalid payload");
    }
    if (result.payload.username === "" || result.payload.username === null || result.payload.username === undefined){
        throw new Error("Username is required");
    }
    if (result.payload.email === "" || result.payload.email === null || result.payload.email === undefined){
        throw new Error("Email is required");
    }
    if (result.payload.password === "" || result.payload.password === null || result.payload.password === undefined){
        throw new Error("Password is required");
    }
    if (result.payload.phone === "" || result.payload.phone === null || result.payload.phone === undefined){
        throw new Error("Phone is required");
    }
    if (result.payload.payment_method === "" || result.payload.payment_method === null || result.payload.payment_method === undefined){
        throw new Error("Payment method is required");
    }
    if (result.payload.product === "" || result.payload.product === null || result.payload.product === undefined){
        throw new Error("Product is required");
    }
    if (result.payload.amount === "" || result.payload.amount === null || result.payload.amount === undefined){
        throw new Error("Amount is required");
    }
    if (result.payload.discount === "" || result.payload.discount === null || result.payload.discount === undefined){
        throw new Error("Discount is required");
    }
    return result;
}
exports.getPrice = async (result) => {
    try{
        const [rows] = await db.query("SELECT price FROM products WHERE code = ?", [result.payload.product]);
        if (rows.length == 0 ){
            throw new Error("Product not found");
        }
        result.payload.price = rows[0].price;
    }catch(err){
        throw new Error(err);
    }
    return result;
}
exports.countTotal = async (result) => {
    try{
        result.payload.total = result.payload.price * result.payload.amount;
    }catch(err){
        throw new Error(err);
    }
    return result;
}

// ============= CHECKOUT AUTH ==============

exports.checkout_add_user = async (result) =>{
    const user = result.user;

    let user_id;

    if(user){
        // user already login
        user_id = user.id;
    }else{
        // user not login (create new user)
        const query = `INSERT INTO users (email, phone, name) VALUES ($1, $2, $3)`;
        try{
            const [rows] = await db.query(query, [result.email, result.phone, result.name]);
            user_id = rows[0].id;
        }catch(err){
            throw new Error(err);
        }
    }

    return user_id;
};


