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
        const paramsStr = createPutParamsString(entries)
        const params = entries.map(entry => entry[1])
        params.push(parseInt(id))
        
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
            con.query(query, [parseInt(id)], (err, results, fields) => {
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

// Plans
app.get('/plans', isAuth, (req, res) => {
    con = mysql.createConnection(dbConfig) // create new connection to db for query
    con.connect((err) => {
        const {user_email} = req.body
        con.query("SELECT * FROM workout_plan WHERE user_email = ?", [user_email], (err, results, fields) => {
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

app.post('/plans', isAuth, (req, res) => {
    con = mysql.createConnection(dbConfig) // create new connection to db for query
    con.beginTransaction((err) => {
        // store the included values to params
        const {user_email, title, days_of_week} = req.body

        // first check that this user has no plans with the given title
        let query = "SELECT COUNT(*) AS num_rows FROM workout_plan WHERE user_email = ? AND title = ?"
        let params = [user_email, title]
        con.query(query, params, (err, results, fields) => {
            // internal server error handling
            if (err) {
                console.error(err)
                res.sendStatus(500)
                return con.rollback(() => {
                    throw err
                })
            }

            const count = results[0].num_rows
            if (count > 0) {
                res.json({
                    "Status": "Bad Request",
                    "Response": "You already have a workout plan with this title"
                })
                return con.rollback(() => {
                    throw err
                })
            }
        })

        const creation_date = new Date().toISOString().slice(0, 19).replace('T', ' ');
        query = "INSERT INTO workout_plan (user_email, title, days_of_week, creation_date) VALUES (?, ?, ?, ?)"
        params = [user_email, title, days_of_week, creation_date]
        
        con.query(query, params, (err, results, fields) => {
            // internal server error handling
            if (err) {
                console.error(err)
                res.sendStatus(500)
                return con.rollback(() => {
                    throw err
                })
            }
        })

        con.commit((err) => {
            if (err) {
                console.error(err)
                res.sendStatus(500)
                return con.rollback(() => {
                    throw err
                })
            }
        })

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
    }) 
})

app.put('/plans/:user_email/:title', isAuth, (req, res) => {
    con = mysql.createConnection(dbConfig) // create new connection to db for query
    con.beginTransaction((err) => {
        // get the plan id
        const {user_email, title} = req.params

        // if the user is trying to change the title of their plan, make sure they have no OTHER plans with the new title
        let query
        let params
        if (req.body.title && title !== req.body.title) { // if they are changing the title and its not the same as the this record's current title
            query = "SELECT COUNT(*) AS num_rows FROM workout_plan WHERE user_email = ? AND title = ?"
            params = [user_email, req.body.title]
            con.query(query, params, (err, results, fields) => {
                // internal server error handling
                if (err) {
                    console.error(err)
                    res.sendStatus(500)
                    return con.rollback(() => {
                        throw err
                    })
                }

                const count = results[0].num_rows
                if (count > 0) {
                    res.json({
                        "Status": "Bad Request",
                        "Response": "You already have a workout plan with this title"
                    })
                    return con.rollback(() => {
                        throw err
                    })
                }
            })
        }

        // prevent changing the user_email and creation_date
        const entries = Object.entries(req.body).filter(([key, value]) => key !== "user_email" && key !== "creation_date")

        // update the plan
        const paramsStr = createPutParamsString(entries)
        params = entries.map(entry => entry[1])
        params = [...params, user_email, title]
        query = `UPDATE workout_plan SET ${paramsStr} WHERE user_email = ? AND title = ?`

        con.query(query, params, (err, results, fields) => {
            // internal server error handling
            if (err) {
                console.error(err)
                res.sendStatus(500)
                return con.rollback(() => {
                    throw err
                })
            }

            con.commit((err) => {
                if (err) {
                    console.error(err)
                    res.sendStatus(500)
                    return con.rollback(() => {
                        throw err
                    })
                }
            })

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
        })
    }) 
})

app.delete('/plans/:user_email/:title', isAuth, (req, res) => {
    con = mysql.createConnection(dbConfig) // create new connection to db for query
    con.connect((err) => {
        // get the plan id
        const {user_email, title} = req.params
        
        const query = "DELETE FROM workout_plan WHERE user_email = ? AND title = ?"

        con.query(query, [user_email, title], (err, results, fields) => {
            // internal server error handling
            if (err) {
                console.error(err)
                res.sendStatus(500)
                con.destroy() // destory connection if still alive
            } else {
                res.json({
                    "Status": "OK"
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

// Goals
app.get('/goals', isAuth, (req, res) => {
    con = mysql.createConnection(dbConfig) // create new connection to db for query
    con.beginTransaction((err) => {
        const {user_email} = req.body

        // Get all the users goal records, and get all the specific types of goals in parallel with Promises
        con.query("SELECT * FROM goal WHERE user_email = ?", [user_email], (err, results, fields) => {
            // internal server error handling
            if (err) {
                console.error(err)
                res.sendStatus(500)
                return con.rollback(() => {
                    throw err
                })
            } else {
                // Get the IDs for all the queried goals, and split them into 4 arrays
                const misc_goal_ids = []
                const endurance_goal_ids = []
                const weight_goal_ids = []
                const body_weight_goal_ids = []
                results.forEach(goal => {
                    switch (goal.type) {
                        case "misc":
                            misc_goal_ids.push(goal.id)
                            break
                        case "endurance":
                            endurance_goal_ids.push(goal.id)
                            break
                        case "weight":
                            weight_goal_ids.push(goal.id)
                            break
                        case "body_weight":
                            body_weight_goal_ids.push(goal.id)
                            break
                        default:
                            console.error(`Invalid goal type: ${goal.type}`)
                            res.sendStatus(400)
                            return con.rollback(() => {
                                throw err
                            })
                    }
                })

                // Each promise runs a separate query
                const promises = [
                    new Promise((resolve, reject) => {
                        const idListStr = createIdListParamStr(misc_goal_ids)
                        con.query(`SELECT * FROM goal INNER JOIN misc_goal ON goal.id = misc_goal.id WHERE goal_id IN ${idListStr}`,
                            misc_goal_ids, (err, results, fields) => {
                            if (err) reject(err)
                            else resolve(results)
                        });
                    }),
                    new Promise((resolve, reject) => {
                        const idListStr = createIdListParamStr(endurance_goal_ids)
                        con.query(`SELECT * FROM goal INNER JOIN endurance_goal ON goal.id = endurance_goal.id WHERE goal_id IN ${idListStr}`,
                            endurance_goal_ids, (err, results, fields) => {
                            if (err) reject(err)
                            else resolve(results)
                        });
                    }),
                    new Promise((resolve, reject) => {
                        const idListStr = createIdListParamStr(weight_goal_ids)
                        con.query(`SELECT * FROM goal INNER JOIN weight_goal ON goal.id = weight_goal.id WHERE goal_id IN ${idListStr}`,
                            weight_goal_ids, (err, results, fields) => {
                            if (err) reject(err)
                            else resolve(results)
                        });
                    }),
                    new Promise((resolve, reject) => {
                        const idListStr = createIdListParamStr(body_weight_goal_ids)
                        con.query(`SELECT * FROM goal INNER JOIN body_weight_goal ON goal.id = body_weight_goal.id WHERE goal_id IN ${idListStr}`,
                            body_weight_goal_ids, (err, results, fields) => {
                            if (err) reject(err)
                            else resolve(results)
                        });
                    })
                ];

                // Run all the queries in parallel and return their aggregated results as a json response
                Promise.all(promises)
                    .then((resultsArray) => {
                        con.commit((err) => {
                            if (err) {
                                console.error(err)
                                res.sendStatus(500)
                                return con.rollback(() => {
                                    throw err
                                })
                            }
                        })

                        // Send the combined results as a JSON response
                        res.json({
                            "Status": "OK",
                            "Response": {
                                "misc_goals": resultsArray[0],
                                "endurance_goals": resultsArray[1],
                                "weight_goals": resultsArray[2],
                                "body_weight_goals": resultsArray[3]
                            }
                        })
                    })
                    .catch((err) => {
                        console.error(err)
                        res.sendStatus(500)
                        return con.rollback(() => {
                            throw err
                        })
                    })
                    .finally(() => {
                        // gracefully end connection after sending data, if error destroy connection (force close)
                        con.end((err) => {
                            if (err) {
                                console.error(err)
                                con.destroy()
                            }
                        })
                    })
            }
        })
    }) 
})

app.post('/goals', isAuth, (req, res) => {
    con = mysql.createConnection(dbConfig) // create new connection to db for query
    con.beginTransaction((err) => { // Use a transaction since we are querying two tables
        // store the exercise_type value and add all the other included values to params
        const {user_email, type, deadline, description, exercise_name, time, sets, reps, weight, start_weight, goal_weight} = req.body
        const completed = 0
        const creation_date = new Date().toISOString().slice(0, 19).replace('T', ' ')
        let query = "INSERT INTO goal (user_email, type, deadline, completed, creation_date) VALUES (?, ?, ?, ?, ?); SELECT LAST_INSERT_ID() AS id;"
        let params = [user_email, type, deadline, completed, creation_date]
        
        con.query(query, params, (err, results, fields) => {
            // internal server error handling
            if (err) {
                console.error(err)
                res.sendStatus(500)
                return con.rollback(() => {
                    throw err
                })
            }

            const id = results[1][0].id // Select is the second query, which has 1 row, which has only an id property (hence, results[1][0].id)

            switch (type) {
                case "misc":
                    query = "INSERT INTO misc_goal (goal_id, description) VALUES (?, ?)"
                    params = [id, description]
                    break
                case "endurance":
                    query = "INSERT INTO endurance_goal (goal_id, exercise_name, time) VALUES (?, ?, ?)"
                    params = [id, exercise_name, time]
                    break
                case "weight":
                    query = "INSERT INTO weight_goal (goal_id, exercise_name, sets, reps, weight) VALUES (?, ?, ?, ?, ?)"
                    params = [id, exercise_name, sets, reps, weight]
                    break
                case "body_weight":
                    query = "INSERT INTO body_weight_goal (goal_id, start_weight, goal_weight) VALUES (?, ?, ?)"
                    params = [id, start_weight, goal_weight]
                    break
                default:
                    console.error(`Invalid goal type: ${goal.type}`)
                    res.sendStatus(400)
                    return con.rollback(() => {
                        throw err
                    })
            }

            con.query(query, params, (err, results, fields) => {
                // internal server error handling
                if (err) {
                    console.error(err)
                    res.sendStatus(500)
                    return con.rollback(() => {
                        throw err
                    })
                }

                con.commit((err) => {
                    if (err) {
                        console.error(err)
                        res.sendStatus(500)
                        return con.rollback(() => {
                            throw err
                        })
                    }
                })

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
            })
        })
    }) 
})

app.put('/goals/:id', isAuth, (req, res) => {
    con = mysql.createConnection(dbConfig) // create new connection to db for query
    con.beginTransaction((err) => { // Use a transaction since we are querying two tables
        // get the goal id
        const {id} = req.params
        // store the type value
        const {type} = req.body
        // Add all the other params to two arrays, one corresponding to the goal table query, the other corresponding to the specific goal type's table
        const entries = Object.entries(req.body).filter(([key, value]) => key !== "type" && key !== "creation_date") // Can't change type or creation_date
        const goal_entries = []
        const specific_goal_entries = []
        entries.forEach(([key, value]) => {
            if (key in ["user_email", "deadline", "completed"]) {
                goal_entries.push([key, value])
            } else {
                specific_goal_entries.push([key, value])
            }
        })

        // update the tables that have entries to be updated
        if (goal_entries.length > 0) {
            const paramsStr = createPutParamsString(goal_entries)
            const params = goal_entries.map(entry => entry[1])
            params.push(parseInt(id))
            const query = `UPDATE goal SET ${paramsStr} WHERE id = ?`

            con.query(query, params, (err, results, fields) => {
                if (err) {
                    console.error(err)
                    res.sendStatus(500)
                    return con.rollback(() => {
                        throw err
                    })
                }
            })
        }
        
        if (specific_goal_entries.length > 0) {
            const paramsStr = createPutParamsString(specific_goal_entries)
            const params = specific_goal_entries.map(entry => entry[1])
            params.push(parseInt(id))

            // Get the table name based on type and create the query
            const table_name = `${type}_goal`
            const query = `UPDATE ${table_name} SET ${paramsStr} WHERE goal_id = ?`

            con.query(query, params, (err, results, fields) => {
                if (err) {
                    console.error(err)
                    res.sendStatus(500)
                    return con.rollback(() => {
                        throw err
                    })
                }
            })
        }

        con.commit((err) => {
            if (err) {
                console.error(err)
                res.sendStatus(500)
                return con.rollback(() => {
                    throw err
                })
            }
        })

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
    }) 
})

app.delete('/goals/:id', isAuth, (req, res) => {
    con = mysql.createConnection(dbConfig) // create new connection to db for query
    con.connect((err) => {
        // get the goal id
        const {id} = req.params

        // delete the goal (cascade set for the specific goal type's table, so we only need to delete from goal table)
        let query = `DELETE FROM goal WHERE id = ?`

        con.query(query, [parseInt(id)], (err, results, fields) => {
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
    }) 
})

// Workout Plan Exercises
app.get('/workout-plan-exercises', isAuth, (req, res) => {
    con = mysql.createConnection(dbConfig) // create new connection to db for query
    con.beginTransaction((err) => {
        const {user_email, workout_plan_title} = req.body

        // Each promise runs a separate query. Gets the weight exercises and the endurance exercises corresponding to this plan
        // using an INNER JOIN
        const promises = [
            new Promise((resolve, reject) => {
                con.query(`SELECT * FROM weight_exercise INNER JOIN workout_plan_weight_exercise \
                    ON weight_exercise.id = workout_plan_weight_exercise.weight_exercise_id WHERE \
                    workout_plan_weight_exercise.user_email = ? AND workout_plan_weight_exercise.workout_plan_title = ?`,
                    [user_email, workout_plan_title], (err, results, fields) => {
                    if (err) reject(err)
                    else resolve(results)
                });
            }),
            new Promise((resolve, reject) => {
                con.query(`SELECT * FROM endurance_exercise INNER JOIN workout_plan_endurance_exercise \
                    ON endurance_exercise.id = workout_plan_endurance_exercise.endurance_exercise_id WHERE \
                    workout_plan_endurance_exercise.user_email = ? AND workout_plan_endurance_exercise.workout_plan_title = ?`,
                    [user_email, workout_plan_title], (err, results, fields) => {
                    if (err) reject(err)
                    else resolve(results)
                });
            })
        ];

        // Run all the queries in parallel and return their aggregated results as a json response
        Promise.all(promises)
            .then((resultsArray) => {
                con.commit((err) => {
                    if (err) {
                        console.error(err)
                        res.sendStatus(500)
                        return con.rollback(() => {
                            throw err
                        })
                    }
                })

                // Send the combined results as a JSON response
                res.json({
                    "Status": "OK",
                    "Response": {
                        "weight_exercises": resultsArray[0],
                        "endurance_exercises": resultsArray[1]
                    }
                })
            })
            .catch((err) => {
                console.error(err)
                res.sendStatus(500)
                return con.rollback(() => {
                    throw err
                })
            })
            .finally(() => {
                // gracefully end connection after sending data, if error destroy connection (force close)
                con.end((err) => {
                    if (err) {
                        console.error(err)
                        con.destroy()
                    }
                })
            })
    }) 
})

app.post('/workout-plan-exercises', isAuth, (req, res) => {
    con = mysql.createConnection(dbConfig) // create new connection to db for query
    con.connect((err) => {
        // store the exercise_type value and add all the other included values to params
        const {exercise_type} = req.body
        const {user_email, workout_plan_title, exercise_id} = req.body

        // check for valid exercise type
        let table_name = null
        if (exercise_type === "endurance") { // endurance exercise
            table_name = "workout_plan_endurance_exercise"
        } else if (exercise_type === "weight") { // weight exercise
            table_name = "workout_plan_weight_exercise"
        } else {    // invalid
            res.sendStatus(400)
            con.destroy()
        }

        if (table_name) {
            const query = `INSERT INTO ${table_name} (user_email, workout_plan_title, exercise_id) VALUES (?, ?, ?)`
            const params = [user_email, workout_plan_title, exercise_id]
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

// NOTE: there is not put for workout-plan-exercises because all the columns are the PK, and these are only affected in these tables through CASCADE

app.delete('/workout-plan-exercises/:user_email/:workout_plan_title/:exercise_id', isAuth, (req, res) => {
    con = mysql.createConnection(dbConfig) // create new connection to db for query
    con.connect((err) => {
        // get the workout plan exercise's PK attributes
        const {user_email, workout_plan_title, exercise_id} = req.params

        // get the exercise type so we know which table to delete from
        const {exercise_type} = req.body

        // check for valid exercise type
        let table_name = null
        if (exercise_type === "endurance") { // endurance exercise
            table_name = "workout_plan_endurance_exercise"
        } else if (exercise_type === "weight") { // weight exercise
            table_name = "workout_plan_weight_exercise"
        } else {    // invalid
            res.sendStatus(400)
            con.destroy()
        }

        // delete the workout plan exercise from the corresponding table
        if (table_name) {
            const query = `DELETE FROM ${table_name} WHERE user_email = ? AND workout_plan_title = ? AND exercise_id = ?`
            const params = [user_email, workout_plan_title, exercise_id]

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

// app listen
app.listen(port, () => {
    console.log(`API listening on port ${port}`)
})

// utility functions

// Add each pair of [columnName, newValue] to the string using SQL syntax
function createPutParamsString(entries) {
    str = ""
    for (let i = 0; i < entries.length; i++) {
        str += `${entries[i][0]} = ?, `
    }
    str = str.slice(0, -2)
    return str
}

function createIdListParamStr(ids) {
    str = "("
    for (let id in ids) {
        str += "?, "
    }
    str = str.slice(0, -2) + ")"
    return str
}