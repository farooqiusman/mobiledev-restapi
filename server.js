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

app.get('/endurance-exercises', isAuth, (req, res) => {
    con = mysql.createConnection(dbConfig) // create new connection to db for query
    con.connect((err) => {
        const {user_email} = req.body

        con.query("SELECT * FROM endurance_exercise WHERE user_email = ?", [user_email], (err, results, fields) => {
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

app.post('/exercises', isAuth, (req, res) => {
    con = mysql.createConnection(dbConfig) // create new connection to db for query
    con.connect((err) => {
        // store the exercise_type value and add all the other included values to params
        const {exercise_type} = req.body
        const {name, user_email, time, sets, reps, weight} = req.body
        let query = null
        params = [name, user_email]
        if (exercise_type === "endurance") { // endurance exercise
            query = "INSERT INTO endurance_exercise (name, user_email, time) VALUES (?, ?, ?)"
            params.push(time)
        } else if (exercise_type === "weight") { // weight exercise
            query = "INSERT INTO weight_exercise (name, user_email, sets, reps, weight) VALUES (?, ?, ?, ?, ?)"
            params.push(...[sets, reps, weight])
        } else {    // invalid
            res.sendStatus(400)
            con.destroy()
            return
        }
        if (query) {
            con.query(query, params, (err, results, fields) => {
                // internal server error handling
                if (err) {
                    console.error(err)
                    res.sendStatus(500)
                    con.destroy() // destory connection if still alive
                } else {
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
        }
    }) 
})

app.put('/exercises/:id', isAuth, (req, res) => {
    con = mysql.createConnection(dbConfig) // create new connection to db for query
    con.connect((err) => {
        // get the exercise id
        const {id} = req.params
        // store the exercise_type value and add all the other included values to params
        const {exercise_type} = req.body
        const entries = Object.entries(req.body).filter(([key, value]) => key !== "exercise_type")
        const paramsStr = createPutParamsString(entries.length)
        const params = entries.flat()
        params.push(id)
        
        let query = null
        if (exercise_type === "endurance") { // endurance exercise
            query = `UPDATE endurance_exercise SET ${paramsStr} WHERE id = ?`
        } else if (exercise_type === "weight") { // weight exercise
            query = `UPDATE weight_exercise SET ${paramsStr} WHERE id = ?`
        } else {    // invalid
            res.sendStatus(400)
            con.destroy()
            return
        }
        if (query) {
            con.query(query, params, (err, results, fields) => {
                // internal server error handling
                if (err) {
                    console.error(err)
                    res.sendStatus(500)
                    con.destroy() // destory connection if still alive
                } else {
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
        }
    }) 
})

app.delete('/exercises/:id', isAuth, (req, res) => {
    con = mysql.createConnection(dbConfig) // create new connection to db for query
    con.connect((err) => {
        // get the exercise id and exercise type (so we know which table to delete from)
        const {id} = req.params
        const {exercise_type} = req.body
        
        let query = null
        if (exercise_type === "endurance") { // endurance exercise
            query = "DELETE FROM endurance_exercise WHERE id = ?"
        } else if (exercise_type === "weight") { // weight exercise
            query = "DELETE FROM weight_exercise WHERE id = ?"
        } else {    // invalid
            res.sendStatus(400)
            con.destroy()
            return
        }
        if (query) {
            con.query(query, [id], (err, results, fields) => {
                // internal server error handling
                if (err) {
                    console.error(err)
                    res.sendStatus(500)
                    con.destroy() // destory connection if still alive
                } else {
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
        }
    }) 
})

// app listen
app.listen(port, () => {
    console.log(`API listening on port ${port}`)
})

// utility functions

// Add each pair of [columnName, newValue] to the string using SQL syntax
function createPutParamsString(length) {
    str = ""
    for (let i = 0; i < length; i++) {
        str += "? = ?, "
    }
    str = str.slice(0, -2)
    return str
}
