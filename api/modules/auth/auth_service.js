const {db} = require('../../common/helper');
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt');

// normal register
exports.register = async (body) =>{
    const {username, email, password, phone} = body;
    const query = `INSERT INTO users (username, email, password, phone) VALUES ($1, $2, $3, $4)`;
    const hashedPassword = await bcrypt.hash(password, 10);
    try{
        await db.query(query, [username, email, hashedPassword, phone]);
        return;
    }catch(err){
        throw new Error(err);
    }
};
// normal login
exports.login = async (body) =>{
    const {email, password} = body;
    const query = `SELECT * FROM users WHERE email = $1`;

    // search user by email
    try{
        const {rows} = await db.query(query, [email]); 
        const user = rows[0];
        if (!user){
            throw new Error("User not found");
        }
    }catch(err){
        throw new Error(err);
    }

    // compare password
    try{
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid){
            throw new Error("Invalid password");
        }
    }catch(err){
        throw new Error(err);
    }

    // generate token
    try{
        const token = jwt.sign({
            id: user.id,
            email : user.email
        }, process.env.JWT_SECRET, {expiresIn: "24h"});

        return {
            user : user,
            token : token
        };
    }catch(err){
        throw new Error(err);
    }
};
// register in checkout
exports.registerCheckout = async (body) =>{
    const {username, email, password, phone} = body;
    const query = `INSERT INTO users (username, email, password, phone) VALUES ($1, $2, $3, $4)`;
    try{
        const [rows] = await db.query(query, [username, email, password, phone]);
        return rows;
    }catch(err){
        throw new Error(err);
    }
};
