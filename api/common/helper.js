const {Pool} = require('pg');
const dotenv = require("dotenv");
dotenv.config();

 // create db connection
let pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});
const db = pool;
pool.on('connect', () => {
    console.log('Connected to database');
});
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});


// workker 20s
const checkout_service = require("../modules/checkout/checkout_service");
exports.worker20 = ()=>{
    setInterval(() => {
        console.log('20 seconds have passed');
        checkout_service.checkout_send_whatsapp();
        checkout_service.checkout_send_email();
    }, 20000);
}
module.exports = {
    db,
    worker20
}