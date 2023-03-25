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

// return all agents for requested store ID
app.get('/get-agents', isAuth, (req,res) => {
    if (req.query.store) {
        con = mysql.createConnection(dbConfig) // create new connection to db for query
        con.connect((err) => {
            con.query(`SELECT agentName, agentNT FROM agentTable WHERE storeNum = ${req.query.store}`, (err, results, fields) => {
                if (err) {
                    // internal server error handling
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
    } else {
        // error handling for missing URL params
        res.status(400).json({
            "Status": 400,
            "Response": "Bad request. Missing required parameters."
        })
    }
})

// return all interaction data in the table, warning size may very
app.get('/get-all-interaction-data', isAuth, (req,res) => {
    con = mysql.createConnection(dbConfig) // create new connection to db for query
    con.connect((err) => {
        con.query("SELECT * FROM Interaction_Data_0944", (err, results, fields) => {
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

// return calculated time of latest interaction
app.get('/get-latest-interaction', isAuth, (req, res) => {
    con = mysql.createConnection(dbConfig) // create new connection to db for query
    con.connect((err) => {
        con.query("SELECT Calculated_Time FROM Interaction_Data_0944 ORDER BY INT_ID DESC LIMIT 1", (err, results, fields) => {
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

// post route for new interaction data
app.post('/new-interaction', isAuth, (req,res) => {
    // check for required body data and send response back with body data
    if (req.body.Date && req.body.Time && req.body.User && req.body.Till && req.body.Int_Start && req.body.Int_End && req.body.Calculated_Time && req.body.Interaction_Type && req.body.Interaction_SubCategory && req.body.BBM_Status) {
        con = mysql.createConnection(dbConfig) // create new connection to db for query
        // connect to database and insert post body data into new row
        con.connect((err) => {
            con.query(`INSERT INTO Interaction_Data_0944 (Date, Time, User, Till, Int_Start, Int_End, Calculated_Time, Interaction_Type, Interaction_SubCategory,BBM_Status) VALUES ('${req.body.Date}', '${req.body.Time}', '${req.body.User}', '${req.body.Till}', '${req.body.Int_Start}', '${req.body.Int_End}', '${req.body.Calculated_Time}', '${req.body.Interaction_Type}', '${req.body.Interaction_SubCategory}', '${req.body.BBM_Status}')`, (err, results, fields) => {
                // internal server error handling
                if (err) {
                    console.error(err)
                    res.sendStatus(500)
                    con.destroy() // destory connection if still alive
                } else {
                    // send OK status and body response to user after successful data insert
                    console.log(results)
                    res.json({
                        "Status": "OK",
                        "Response": [req.body]
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
    } else {
        // error handling for missing body data
        res.status(400).json({
            "Status": 400,
            "Response": "Bad request. Missing required parameters."
        })
    }
})

// post route for new setup pickup data
app.post('/new-setup-pickup', isAuth, (req,res) => {
    // check for required body data and send response back with body data
    if (req.body.Date && req.body.Time && req.body.Setup_Device && req.body.Setup_Type) {
        con = mysql.createConnection(dbConfig) // create new connection to db for query
        // connect to database and insert post body data into new row
        con.connect((err) => {
            con.query(`INSERT INTO Setup_Data_0944 (Date, Time, Setup_Device, Setup_Type) VALUES ('${req.body.Date}', '${req.body.Time}', '${req.body.Setup_Device}', '${req.body.Setup_Type}')`, (err, results, fields) => {
                if (err) {
                    // internal server error handling
                    console.error(err)
                    res.sendStatus(500)
                    con.destroy() // destory connection if still alive
                } else {
                    // send OK status and body response to user after successful data insert
                    console.log(results)
                    res.json({
                        "Status": "OK",
                        "Response": [req.body]
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
    } else {
        // error handling for missing body data
        res.status(400).json({
            "Status": 400,
            "Resposne": "Bad request. Missing required parameters."
        })
    }
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

