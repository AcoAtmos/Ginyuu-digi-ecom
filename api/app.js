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

// Set up routes
app.use("/api", routes);

// Start server
app.listen(process.env.PORT || 4100, ()=>{
    console.log(`server berjalan pada port ${process.env.PORT || 4100} yatta`);
});