const {db} = require('../../common/helper');
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt');

// normal register
exports.register = async (body) =>{
    const {username, email, password, phone, terms} = body;
    const query = `INSERT INTO users (username, email, password, phone, terms) VALUES ($1, $2, $3, $4, $5)`;
    const hashedPassword = await bcrypt.hash(password, 10);
    try{
        await db.query(query, [username, email, hashedPassword, phone, terms]);
        return;
    }catch(err){
        throw new Error(err);
    }
};
// normal login
exports.login = async (body) =>{
    const {email, password} = body;
    const query = `SELECT * FROM users WHERE email = $1`;

    try{
        // search user by email
        const {rows} = await db.query(query, [email]); 
        const user = rows[0];

        if (!user){
            throw new Error("User not found");
        }

        // compare password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid){
            throw new Error("Invalid password");
        }

        // generate token
        const token = jwt.sign({
            id: user.id,
            email : user.email
        }, process.env.JWT_SECRET, {expiresIn: "24h"});

        return {
            user : {
                username : user.username,
                email : user.email,
                phone : user.phone,
                image_url : user.image_url
            },
            token : token
        };
    }catch(err){
        throw new Error(err);
    }
};
// register in checkout
exports.registerCheckout = async (body) =>{
    const {username, email, password, phone} = body;
    const query = `INSERT INTO users (username, email, password, phone) VALUES ($1, $2, $3, $4) RETURNING *`;
    const hashedPassword = await bcrypt.hash(password, 10);
    try{
        const {rows} = await db.query(query, [username, email, hashedPassword, phone]);
        return rows[0];
    }catch(err){
        throw new Error(err);
    }
};
