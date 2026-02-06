const express = require("express"); // package
const routes = require("./common/routes"); // file makanya pakai ./
const path = require("path");
const app = express();

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

app.use("/", routes);

app.listen("3100", ()=>{
    console.log("server berjalan pada port 3100");
});