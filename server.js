//npm i method-override --save
const express = require('express')
const bodyParser = require('body-parser')
const mysql = require('mysql')
const session = require('express-session')
const methodOverride = require('method-override')

const app = express()
const port = process.env.PORT || 5000

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(methodOverride('_method'))
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

let username, password

let login_data, routedata
let ses

let origin, goal, F_route
let dateTime
let travel

let dataForm_customer
let amount
let dataConfirm
let travelId
let idcard

let orderHis
let orderCancel
let changeID
let statusChange = false
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


})
app.get('/home', (req, res) => {

    if (req.session.loggedin) {
        res.render('home', { login_data: login_data, routedata: routedata, orderHis: orderHis, ses: ses = true })
    } else {
        res.render('home', { routedata: routedata, ses: ses = false })
    }
})
// ข้อมูลทดสอบสมัครสมาชิก
/*
1212123123121
เทพ
โพธฺงาม
0666666666
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
                            res.send('<script>;setTimeout(function(){alert("เปลี่ยนตั๋วสำเร็จ!");window.location.href="/index";}, 1000);</script>')

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
                    res.redirect('/historyOrder')
                } else {
                    console.log(err)
                }
            })
        })

    } else {
        console.log('Not login')
    }

})
// route
app.post('/home_checkST', (req, res) => {
    origin = req.body.Source
    goal = req.body.Destination
    statusChange = false
    res.redirect('/select_post')
})
app.get('/select_post', (req, res) => {

    console.log(origin)
    console.log(goal)
    con.getConnection((err, connecttion) => {
        if (err) throw err
        console.log('connected id : ', connecttion.threadId)
        connecttion.query('SELECT * FROM `route` WHERE `Source` = ? AND `Destination` = ?', [origin, goal], (err, data) => {
            connecttion.release()
            if (!err) {
                F_route = data
                console.log(F_route)
                res.redirect('train_route')
            } else {
                console.log(err)
            }
        })
    })

})
app.get('/train_route', (req, res) => {
    F_route.forEach(function (item) {
        // console.log(item.Path_ID)
        Path_id = item.Path_ID
    })
    con.getConnection((err, connecttion) => {
        if (err) throw err
        console.log('connected id : ', connecttion.threadId)
        connecttion.query('SELECT * FROM train_schedule WHERE `Path_ID` = ?', Path_id, (err, data) => {
            connecttion.release()
            if (!err) {
                travel = data
                data.forEach(function (item) {
                    const datastring = new Date(item.Time_Date)
                    dateTime = datastring.toLocaleDateString()
                })
                if (statusChange == true) {
                    res.redirect('/conchangeOrder')
                } else {
                    res.redirect('/show_route')
                }
            } else {
                console.log(err)
            }
        })
    })
})
// SELECT * FROM `route` WHERE `Source` = ? AND `Destination` = ?
app.get('/show_route', (req, res) => {
    if (req.session.loggedin) {
        res.render('show_route', { login_data: login_data, dateTime: dateTime, F_route: F_route, origin: origin, goal: goal, ses: ses = true })
    } else {
        res.render('show_route', { F_route: F_route, dateTime: dateTime, origin: origin, goal: goal, ses: ses = false })
    }
})
//add form customer
app.post('/addform_customer', (req, res) => {
    dataForm_customer = req.body
    amount = req.body.amount
    console.log(amount)
    res.redirect('/Order')
})
app.get('/Order', (req, res) => {
    console.log(F_route)
    res.render('order', { login_data: login_data, dateTime: dateTime, F_route: F_route, amount: amount, statusChange: statusChange, ses: ses = true })
})
app.post('/confirmOrder', (req, res) => {
    travel.forEach(function (data) {
        travelId = data.Travel_Id
    })
    login_data.forEach(function (data) {
        idCard = data.Id_Card
    })
    dataConfirm = { Amount: amount, Travel_Id: travelId, Id_Card: idCard }

    res.redirect('/sendOrder')

})
app.get('/sendOrder', (req, res) => {
    console.log(dataConfirm)
    con.getConnection((err, connecttion) => {
        if (err) throw err
        connecttion.query('INSERT INTO purchase_order SET ?', dataConfirm, (err, rows) => {
            connecttion.release()
            if (!err) {
                res.send('<script>;setTimeout(function(){alert("จองตั๋วสำเร็จ!");window.location.href="/historyOrder";}, 1000);</script>');
            } else {
                console.log(err)
            }
        })

    })
})
// history order
// ตัวอย่างคำสั่ง JOIN ตาราง
/* 
SELECT purchase_order.Order_Id,purchase_order.Amount,customer.First_Name,customer.Last_Name,train_schedule.Time_Date,route.Source,route.Destination FROM purchase_order JOIN customer ON purchase_order.Id_Card = customer.Id_Card JOIN train_schedule ON purchase_order.Travel_Id = train_schedule.Travel_Id JOIN route ON train_schedule.Path_ID = route.Path_ID;
*/
app.get('/historyOrder', (req, res) => {
    login_data.forEach(function (data) {
        idcard = data.Id_Card
    })
    con.getConnection((err, connecttion) => {
        if (err) throw err
        console.log('connected id : ', connecttion.threadId)
        connecttion.query('SELECT purchase_order.Order_Id,purchase_order.Amount,customer.First_Name,customer.Last_Name,train_schedule.Time_Date,route.Source,route.Destination FROM purchase_order JOIN customer ON purchase_order.Id_Card = customer.Id_Card JOIN train_schedule ON purchase_order.Travel_Id = train_schedule.Travel_Id JOIN route ON train_schedule.Path_ID = route.Path_ID WHERE customer.Id_Card = ?', idcard, (err, data) => {
            connecttion.release()
            if (!err) {
                orderHis = data
                res.redirect('/index')
            } else {
                console.log(err)
            }
        })
    })
})
// cancel
app.post('/cancelOrder', (req, res) => {
    con.getConnection((err, connecttion) => {
        if (err) throw err
        console.log('connect id : ?', connecttion.threadId)
        //ลบข้อมูล โดยใช้ ้ id
        connecttion.query('DELETE FROM `purchase_order` WHERE `Order_Id`= ?', req.body.orderid, (err, rows) => {
            connecttion.release()
            if (!err) {
                res.send('<script>;setTimeout(function(){alert("ยกเลิกตั๋วสำเร็จ!");window.location.href="/historyOrder";}, 1000);</script>');
            } else {
                console.log(err)
            }
        })
    })
})

// change order
app.post('/changeOrder', (req, res) => {
    changeID = req.body.orderid
    res.render('changeOrder', { login_data: login_data, routedata: routedata, dateTime: dateTime, F_route: F_route, orderHis: orderHis, origin: origin, goal: goal, travel, ses: ses = true, statusChange: statusChange })
})
app.post('/change_order', (req, res) => {
    origin = req.body.Source
    goal = req.body.Destination
    statusChange = true
    res.redirect('/select_post')
})
app.get('/conchangeOrder', (req, res) => {
    res.render('changeOrder', { login_data: login_data, routedata: routedata, dateTime: dateTime, F_route: F_route, origin: origin, goal: goal, orderHis: orderHis, travel: travel, ses: ses = true, statusChange: statusChange })
})
app.post('/updateorder', (req, res) => {
    dataForm_customer = req.body
    amount = req.body.amount
    res.redirect('/Order')
})
app.put('/update_Order', (req, res) => {
    travel.forEach(function (data) {
        travelId = data.Travel_Id
    })
    login_data.forEach(function (data) {
        idCard = data.Id_Card
    })
    dataConfirm = { Amount: amount, Travel_Id: travelId, Id_Card: idCard }
    const testdata = { amount, travelId, idcard, changeID }
    console.log(testdata)
    con.getConnection((err, connecttion) => {
        console.log('connect id : ?', connecttion.threadId)
        connecttion.query('UPDATE purchase_order SET Amount = ?,Travel_Id = ?,Id_Card = ? WHERE Order_Id = ?', [amount, travelId, idCard, changeID], (err, rows) => {
            connecttion.release()
            if (!err) {
                res.send('<script>;setTimeout(function(){alert("เปลี่ยนตั๋วสำเร็จ!");window.location.href="/historyOrder";}, 1000);</script>');
            } else {
                console.log(err)
            }
        })
    })
})

// Openserver
app.listen(port, () => {
    console.log('Server is Listening on port : ', port)
})