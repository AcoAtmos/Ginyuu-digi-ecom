// Set up environment variables
const express = require("express"); // package
const path = require("path");
const app = express();
const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const routes = require("./common/routes"); 

// Set up middleware
app.use(cors({
    origin: process.env.FE_URL || '*',
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Set up worker
const {
    // checkout_send_whatsapp,
    checkout_send_email
} = require("./modules/checkout/checkout_service");
const worker = async()=>{
    setInterval(async() => {
        console.log('10 seconds have passed');
        // await checkout_send_whatsapp();
        await checkout_send_email();
    }, 10000);
} 
// worker();
// Set up routes
app.use("/api", routes);

// Start server
app.listen(process.env.PORT || 4100, ()=>{
    console.log(`server berjalan pada port ${process.env.PORT || 4100} yatta`);
});