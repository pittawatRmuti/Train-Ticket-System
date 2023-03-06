
const express = require('express')
const bodyParser = require('body-parser')
const mysql = require('mysql')
const session = require('express-session')

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

let ses
app.get('/', (req, res) => {
    res.render('home', { ses: ses = false })
    console.log(ses)
})
app.get('/logout', (req, res) => {
    req.session.destroy()
    res.redirect('/')
})
let username
let password
let obj = {}
// จากนั้นจะใช้ POST
app.post('/login', (req, res) => {
    username = req.body.username
    password = req.body.password
    // console.log(username)
    // console.log(password)
    if (username && password) {
        con.query('SELECT * FROM customer WHERE username = ? AND password = ?', [username, password], (err, rows) => {
            if (rows.length > 0) {
                req.session.loggedin = true
                req.session.username = username
                res.redirect('/home')
            } else {
                console.log('not find username')
            }
            res.end()
        })
    }
})

app.get('/home', (req, res) => {

    if (req.session.loggedin) {
        con.getConnection((err, connecttion) => {
            if (err) throw err
            console.log('connected id : ', connecttion.threadId)
            connecttion.query('SELECT * FROM customer WHERE `username` = ? AND `password` = ?', [username, password], (err, data) => {
                connecttion.release()
                if (!err) {
                    obj = { data: data, Error: err, ses: ses = true }
                    console.log('fname : ', obj)

                } else {
                    console.log(err)
                }
            })
        })
        res.render('login', obj)
    } else {
        console.log('Not login')
    }
    res.end()

})



// Openserver
app.listen(port, () => {
    console.log('Server is Listening on port : ', port)
})