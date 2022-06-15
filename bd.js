//Connection with database
const dotenv = require("dotenv");
dotenv.config();
const { Pool } = require('pg');
const connectionString = process.env.DATABASE_URL
const pool = new Pool({
    connectionString,
    ssl: {
        rejectUnauthorized: false
    }
})

//End connection code

const db = {};

db.signIn = (user) => {
    console.log('Sign In...')
    const result = () => new Promise((resolve, reject) => {
        pool.query(`SELECT * from users WHERE username = '${user}'`, (err, res) => {
            if (!err) {
                resolve(res.rows[0])
            } else {
                console.log(err)
                reject(err)
            } 
        })
    }); 
    
    return result; 
}

db.signUp = ({ body }) => {
    const result = () => new Promise((resolve, reject) => {
        pool.query(`INSERT INTO users (user_id, username, hash, salt, name, lastname) VALUES ('${body.user_id}', '${body.username}', '${body.hash}', '${body.salt}', '${body.name}', '${body.lastname}')`, (err, res) => {
            if (!err) {
                resolve(res.rows)
            } else {
                console.log(err)
                reject(err)
            }
        })
    });
    return result;
}

module.exports = db;