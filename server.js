
const express = require('express')
const bodyParser = require('body-parser')
const mysql = require('mysql')
const session = require('express-session')
const e = require('express')

const app = express()
const port = process.env.PORT || 5000

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.set('view engine', 'ejs')
app.use(express.static('public'))

app.use(session({
    secret: 'mysession',
    resave: true,
    saveUninitialized: true
}))

const con = mysql.createPool({
    connectionLimit: 10,
    connectTimeout: 20,
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'train_ticket'
})

let username
let password

let login_data
let routedata
let ses

let origin
let goal
let F_route

// app.get('/', (req, res) => {
//     res.redirect('/index')
// })

// function getRoute(route_data) {
//     return new Promise(function (reslove, reject) {
//         console.log('route_data : ', route_data)
//         if (!route_data) {
//             reslove(route_data = 5)
//             console.log('route_data is : ', route_data)
//         } else {
//             reject(console.log('route_data is : ', route_data))
//         }
//     })
// }

// app.get('/testPage', (req, res) => {
//     return new Promise(function (reslove, reject) {
//         con.getConnection((err, connecttion) => {
//             if (err) throw err
//             console.log('connected id : ', connecttion.threadId)
//             connecttion.query('SELECT * FROM route', (err, data) => {
//                 connecttion.release()
//                 if (!err) {
//                     route_data = { data: data, Error: err }
//                     console.log(route_data)
//                     console.log('getRoute data is success')
//                     reslove(res.redirect('/index'))
//                 } else {
//                     reject(console.log(err))
//                 }
//             })
//         })
//     })
// })
// async function Checkcon(route_data) {
//     app.get('/homePage', (req, res) => {
//         Checkcon(route_data)
//     })
// }
// app.get('/homePage', (req, res) => {
//     Checkcon(route_data)
// })
app.get('/index', (req, res) => {

    con.getConnection((err, connecttion) => {
        if (err) throw err
        console.log('connected id : ', connecttion.threadId)
        connecttion.query('SELECT * FROM route', (err, data) => {
            connecttion.release()
            if (!err) {
                routedata = data
                console.log('route_data success')
                res.redirect('/home')
            } else {
                console.log(err)
            }
        })
    })
    // req.session.loggedin = (req.session.loggedin) ? res.render('home', login_data) : res.render('home', { ses: ses = false })

    // if (req.session.loggedin) {
    //     res.render('home', login_data)
    // } else {
    //     res.render('home', { ses: ses = false })
    // }
    // console.log(route_data)
    // console.log(ses)

})
app.get('/home', (req, res) => {

    if (req.session.loggedin) {
        res.render('home', { login_data: login_data, routedata: routedata, ses: ses = true })
    } else {
        res.render('home', { routedata: routedata, ses: ses = false })
    }
})
// ข้อมูลทดสอบสมัครสมาชิก
/*
1919800275640
เทพ
โพธฺงาม
0612347895
mopuyy3333@gmail.com
ไทย
123456
2022-01-05
U
*/
// Register
app.post('/register', (req, res) => {
    con.getConnection((err, connecttion) => {
        if (err) throw err
        const params = req.body
        console.log(params)
        con.getConnection((err, checkconnect) => {
            checkconnect.query(`SELECT COUNT(Id_Card) As count_id  FROM customer WHERE Id_Card = ${params.Id_Card}`, (err, data) => {
                if (!data[0].count_id) {
                    connecttion.query('INSERT INTO customer SET ?', params, (err, data) => {
                        connecttion.release()
                        if (!err) {
                            res.redirect('/index')
                            console.log('Register Succuss!')
                        } else {
                            console.log(err)
                        }
                    })
                } else {
                    console.log('Cannot Register ')
                }
            })
        })
    })
})
// Loggin
app.get('/logout', (req, res) => {
    req.session.destroy()
    res.redirect('/index')
})

app.post('/login', (req, res) => {
    username = req.body.Email
    password = req.body.Password
    // console.log(username)
    // console.log(password)
    if (username && password) {
        con.query('SELECT * FROM customer WHERE Email = ? AND Password = ?', [username, password], (err, rows) => {
            if (rows.length > 0) {
                req.session.loggedin = true
                req.session.username = username
                res.redirect('/loggedin')
            } else {
                console.log('not find username')
            }

        })
    }
})

app.get('/loggedin', (req, res) => {

    if (req.session.loggedin) {
        con.getConnection((err, connecttion) => {
            if (err) throw err
            console.log('connected id : ', connecttion.threadId)
            connecttion.query('SELECT * FROM customer WHERE `Email` = ? AND `Password` = ?', [username, password], (err, data) => {
                connecttion.release()
                if (!err) {
                    login_data = data
                    // console.log(login_data)
                    res.redirect('/index')
                } else {
                    console.log(err)
                }
            })
        })

    } else {
        console.log('Not login')
    }

})

// app.get('/test_select', (req, res) => {

//     con.getConnection((err, connecttion) => {
//         if (err) throw err
//         console.log('connected id : ', connecttion.threadId)
//         connecttion.query('SELECT * FROM route', (err, data) => {
//             connecttion.release()
//             if (!err) {
//                 res.render('test', { data: data })
//             } else {
//                 console.log(err)
//             }
//         })
//     })
// })
app.post('/select_post', (req, res) => {
    origin = req.body.Source
    goal = req.body.Destination
    console.log(origin)
    console.log(goal)
    con.getConnection((err, connecttion) => {
        if (err) throw err
        console.log('connected id : ', connecttion.threadId)
        connecttion.query('SELECT * FROM `route` WHERE `Source` = ? AND `Destination` = ?', [origin, goal], (err, data) => {
            connecttion.release()
            if (!err) {
                console.log(data)
                F_route = data
                res.redirect('show_route')
            } else {
                console.log(err)
            }
        })
    })

})
// SELECT * FROM `route` WHERE `Source` = ? AND `Destination` = ?
app.get('/show_route', (req, res) => {
    if (req.session.loggedin) {
        res.render('show_route', { login_data: login_data, F_route: F_route, ses: ses = true })
    } else {
        res.render('show_route', { F_route: F_route, ses: ses = false })
    }
})


// Openserver
app.listen(port, () => {
    console.log('Server is Listening on port : ', port)
})