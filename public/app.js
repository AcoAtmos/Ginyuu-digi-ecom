const express = require("express"); // package
const app = express();
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, '.env') });
const routes = require("./common/routes"); // file makanya pakai ./
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'modules'));

// Inject env vars to all EJS templates
app.use((req, res, next) => {
    res.locals.BE_URL = process.env.BE_URL;
    next();
});

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

app.use("/", routes);

app.listen(process.env.PORT, ()=>{
    console.log(`server berjalan pada port ${process.env.PORT}`);
});