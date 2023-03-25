// express setup
const express = require('express')
const app = express()
const port = 3003
app.use(express.json()) //json parsing
require('dotenv').config()

// bcrypt setup
const bcrypt = require('bcrypt')

// bad json syntax error handling
app.use((err, req, res, next) => {
    if (err instanceof err.status === 400 && 'body' in err) {
        console.error(err);
        return res.status(400).send({ Status: 400, Response: err.message });
    }
    next();
});

// mysql setup
const mysql = require('mysql')
var dbConfig = {
    host: process.env.HOST,
    port: 3906,
    user: process.env.USER,
    password: process.env.PASS,
    database: 'MOBILEDEV'
}
var con 

// authentication bcrypt hash

// auth middleware
function isAuth(req,res,next) {
    const auth = req.headers.authorization
    // check if authentication headers were sent, then compare sent credentials against bcrypt hash
    if (auth) {
        const credentials = Buffer.from(auth.split(' ')[1], 'base64').toString('ascii')
        const [username, password] = credentials.split(':')
        const expectedusername = 'mobiledev'
        const expectedpassword = 'mobiledev123*'
        if (username == expectedusername && password == expectedpassword){
            next()
        }else{
            res.sendStatus(401)
        }
    } else {
        // send 401 unauthorized if credentials are missing
        console.log('missing')
        res.sendStatus(401)
    }
}

// check database and database connection
app.get('/status', isAuth, (req,res) => {
    con = mysql.createConnection(dbConfig) // create new connection to db for query
    con.connect((err) => {
        // connect to mysql server, send internal server error if there is an error connecting.
        if (err) {
            console.error(err)
            res.sendStatus(500)
            con.destroy()
        } else {
            // send OK status code to user if connection is successful
            res.json({
                "Status": "OK",
                "Response": "Server is up"
            })
            // gracefully end connection after sending data, if error destroy connection (force close)
            con.end((err) => {
                if (err) {
                    console.error(err)
                    con.destroy()
                }
            })
        }
    })
})
// Exercises
app.get('/weight-exercises', isAuth, (req, res) => {
    con = mysql.createConnection(dbConfig) // create new connection to db for query
    con.connect((err) => {
        const {user_email} = req.body
        con.query("SELECT * FROM weight_exercise WHERE user_email = ?", [user_email], (err, results, fields) => {
            // internal server error handling
            if (err) {
                console.error(err)
                res.sendStatus(500)
                con.destroy() // destory connection if still alive
            } else {
                res.json({
                    "Status": "OK",
                    "Response": results
                })
                // gracefully end connection after sending data, if error destroy connection (force close)
                con.end((err) => {
                    if (err) {
                        console.error(err)
                        con.destroy()
                    }
                })
            }
        })
    }) 
})

// app listen
app.listen(port, () => {
    console.log(`API listening on port ${port}`)
})

