const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require("cors");
const cookieParser = require("cookie-parser");

dotenv.config();

const app = express();
app.set('trust proxy', 1);

// middleware
app.use(cors({ origin: process.env.ADMIN_PUBLIC_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// EJS config
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); 

app.use((req, res, next) => {
    res.locals.ADMIN_PUBLIC_URL = process.env.ADMIN_PUBLIC_URL || `http://localhost:${process.env.ADMIN_PORT || 3100}`;
    next();
});

// Static files
app.use("/assets", express.static(path.join(__dirname, "public")));

// CORS headers
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', process.env.ADMIN_PUBLIC_URL);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Page routes (EJS views)
const { authenticateAdmin } = require('./middleware/auth-admin.middleware');

app.get("/profile", authenticateAdmin, (req, res) => res.render("profile/view", { title: "Profile", page: "profile" }));
app.get("/profile/change-password", authenticateAdmin, (req, res) => res.render("profile/change-password", { title: "Change Password", page: "profile" }));

app.get("/admin/users", authenticateAdmin, (req, res) => res.render("crud/users/list", { title: "Customers", page: "users" }));
app.get("/admin/users/detail/:id", authenticateAdmin, (req, res) => res.render("crud/users/detail", { title: "User Detail", page: "users" }));
app.get("/admin/users/create", authenticateAdmin, (req, res) => res.render("crud/users/create", { title: "Add Customer", page: "users" }));
app.get("/admin/users/edit/:id", authenticateAdmin, (req, res) => res.render("crud/users/edit", { title: "Edit Customer", page: "users" }));

app.get("/admin/orders", authenticateAdmin, (req, res) => res.render("crud/orders/list", { title: "Orders", page: "orders" }));
app.get("/admin/orders/detail/:id", authenticateAdmin, (req, res) => res.render("crud/orders/detail", { title: "Order Detail", page: "orders" }));
app.get("/admin/orders/create", authenticateAdmin, (req, res) => res.render("crud/orders/create", { title: "Create Order", page: "orders" }));
app.get("/admin/orders/edit/:id", authenticateAdmin, (req, res) => res.render("crud/orders/edit", { title: "Edit Order", page: "orders" }));

// Feature routes
const { router: authRoutes, prefix: authPrefix } = require('./features/auth/auth.routes');
const { router: orderRoutes, prefix: ordersPrefix } = require('./features/orders/order.routes');
const { router: profileRoutes, prefix: profilePrefix } = require('./features/profile/profile.routes');
const { router: userRoutes, prefix: userPrefix } = require('./features/users/user.routes');
const { router: dashboardRoutes, prefix: dashboardPrefix } = require('./features/dashboard/dashboard.routes');

// API routes (auth available at both /api/auth and /auth)
app.use("/api" + authPrefix, authRoutes);
app.use("" + authPrefix, authRoutes);
app.use("" + ordersPrefix, orderRoutes);
app.use("" + profilePrefix, profileRoutes);
app.use("" + userPrefix, userRoutes);
app.use("" + dashboardPrefix, dashboardRoutes);

// Start
const port = process.env.ADMIN_PORT || 3100;
app.listen(port, () => {
    console.log(`Admin server running on port ${port}`);
});
