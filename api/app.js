// Set up environment variables
const express = require("express"); // package
const app = express();
const dotenv = require("dotenv");
dotenv.config();
const path = require("path");
const cors = require("cors");
const routes = require("./common/routes"); 

// Set up middleware
app.use(cors({
    origin: "http://localhost:3100",
    credentials: true
}));
app.use(express.json());

// Set up worker
// workker 10s
const {
    checkout_send_whatsapp,
    checkout_send_email
} = require("./modules/checkout/checkout_service");
const worker10 = async()=>{
    setInterval(async() => {
        console.log('10 seconds have passed');
        await checkout_send_whatsapp();
        await checkout_send_email();
    }, 10000);
} 
// worker10();
// Set up routes
app.use("/api", routes);

// Start server
app.listen(process.env.PORT || 4100, ()=>{
    console.log(`server berjalan pada port ${process.env.PORT || 4100} yatta`);
});