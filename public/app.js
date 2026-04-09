const express = require("express"); // package
const app = express();
const path = require("path");
const dotenv = require("dotenv");
dotenv.config();
const routes = require("./common/routes"); // file makanya pakai ./
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// buat folder jadi statis
app.use(
    "/assets",
    (req ,res, next) =>{
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Cache-Control", "public, max-age-86400");
        next();
    },
    express.static(path.join(__dirname, "assets"))
);

app.use(
    "/common",
    (req ,res, next) =>{
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Cache-Control", "public, max-age-86400");
        next();
    },
    express.static(path.join(__dirname, "common"))
);

app.use("/page", routes);

app.listen(process.env.PORT, ()=>{
    console.log(`server berjalan pada port ${process.env.PORT}`);
});