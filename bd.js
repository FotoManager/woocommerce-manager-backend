//Connection with database
const dotenv = require("dotenv");
dotenv.config();
const { Pool } = require('pg');
const connectionString = process.env.DATABASE_SECRET
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
    console.log('Sign Up...')
    const result = () => new Promise((resolve, reject) => {
        pool.query(`INSERT INTO users (id, username, password) VALUES ('${body.id}', '${body.username}', '${body.password}')`, (err, res) => {
            if (!err) {
                resolve(res.rows)
            } else {
                reject(err)
            }
        })
    });
    return result;
}

db.loadOldMessages = ({ body }) => {
    console.log('Loading old messages...')
    const result = () => new Promise((resolve, reject) => {
        pool.query(`SELECT message, time, username as author FROM messages m INNER JOIN users u ON u.id = m.user_id WHERE group_id = '${body.room}'`, (err, res) => {
            if (!err) {
                resolve(res.rows) 
            } else {
                reject(err)
            }   
        }) 
    });  
    
    return result;   
} 

db.insertNewMessage = ({ body }) => {
    console.log('Sending message...', body)
    const result = () => new Promise((resolve, reject) => {
        pool.query(`INSERT INTO messages(group_id,user_id,message,time) Values('${body.room}','${body.id}','${body.message}','${body.time}')`, (err, res) => {
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