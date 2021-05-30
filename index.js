//import packages
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
 
//initialize the app as an express app
const app = express();
const router = express.Router();
const { Client } = require('pg');
const bcrypt = require('bcrypt');

//Insiasi koneksi ke database
const db = new Client({
    user: "postgres",
    password: "",
    host: "localhost",
    port: 5432,
    database: "yogie_10"
});

//Melakukan koneksi dan menunjukkan indikasi database terhubung

//jalankan koneksi ke database
db.connect((err) =>{
    if (err) {
        console.error(err);
        return;
    }
    console.log('Database Connected');
});
 
//middleware (session)
app.use(
    session({
        secret: 'ini contoh secret',
        saveUninitialized: false,
        resave: false
    })
);
app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true
    })
);

var temp;
 
//ROUTERS
 
//Router 1: Menampilkan landing page (login/register)
router.get('/', (req, res) => {
    temp = req.session;
    if (temp.username && temp.visits) { //jika user terdaftar maka akan masuk ke halaman admin
        return res.redirect('/admin');
    } else { //login / register page
        temp.visits = 1;
        res.end(
            `<html>
                <head>
                    <title>Modul 10 - SBD</title>
                </head>
                <body style="background-color: lightblue; text-align: center;">
                    <h1> Pusat Data Covid </h1>
                    <h2> Login </h2>
                    Username:
                    <input type="text" id="username" /><br />
                    Password :
                    <input type="password" id="password" /><br />
                    <input type="button" value="Submit" id="submits" />

                    <h2> Register </h2>
                    Username:
                    <input type="text" id="usernames" /><br />
                    Password :
                    <input type="password" id="passwords" /><br />
                    <input type="button" value="Submit" id="register" />
                    <h3> Modul 10 SBD </h3>
                </body>
                <script src="http://ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js"></script>
                <script>
                    jQuery(document).ready(function($) {
                        var username, pass;
                        $('#submits').click(function() {
                            username = $('#username').val();
                            pass = $('#password').val();
                            
                            $.post('/login', { username: username, pass: pass }, function(data) {
                                if (data === 'done') {
                                    window.location.href = '/admin';
                                    window.alert('Login Sukses');
                                }
                                if (data === 'usernamesalah') {
                                    window.location.href = '/';
                                    window.alert('username salah');
                                }
                                if (data === 'passSalah') {
                                    window.location.href = '/';
                                    window.alert('password salah');
                                }
                            });
                        });
                        $('#register').click(function() {
                            username = $('#usernames').val();
                            pass = $('#passwords').val();
                            
                            $.post('/register', { username: username, pass: pass }, function(data) {
                                if (data === 'done') {
                                    window.location.href = '/admin';
                                    window.alert('Registrasi Sukses');
                                }
                                if (data === 'err') {
                                    window.location.href = '/';
                                    window.alert('Registrasi Gagal');
                                }
                            });
                        });
                    });
                </script>
            </html>`
        );
    }
});
 
//Router 2: for login operation
router.post('/login', (req, res) => {
    temp = req.session;
    temp.username = req.body.username;
    temp.password = req.body.pass;

    //mengecek informasi yang dimasukkan user apakah terdaftar pada database
    
        const users = query(`SELECT * FROM users WHERE username = '${temp.username}'`);
             
        db.query(users, (err, results) => {
            
            if (err) {
                console.error(err);
                res.end(err);
                return;
            }
            
            
            if (users.row.length === 0) {
                res.end('usernamesalah')
            }
            
            bcrypt.compare(temp.password, users.rows[0].password, function(err,result){

            //jika salah
            if(err){
                console.errpr(err);
                res.end('passSalah');
            }
            else {
                console.log('login sukses')
                res.end('done');
            }
        
        });
    });
    
});

router.post('/register', (req, res) => {
    temp = req.session;
    temp.username = req.body.username;
    temp.password = req.body.pass;
    //melakukan registrasi user baru ke dalam database
    try {
        if (temp.username == '' || temp.password == '') {
            res.end('err');
            return res.status(403).send("tidak boleh kosong");
                    }
        const hashedPass = bcrypt.hash(temp.password, 10, function (err, hashedPass) {
        const signUp = 
        `INSERT INTO users(username, password, is_admin) VALUES ('${temp.username}', 
        '${hashedPass}', false)`;
        db.query(signUp, (err, results) => {
            if (err) {
                console.error(err);
                res.end('err');
                return;
            }
        });
        console.log(`data '${temp.username}' berhasil diregistrasi`);
        res.end('done');
        });
    }
    catch (error) {
        console.error(err.message);
        res.status(403).send("Error data");
    }
});

router.post('/delete', (req, res) => {
    temp = req.session;
    temp.id = req.body.id;
    //menghapus data_covid berdasarkan id
    //tambahkan konfigurasi delete di sini
    
    res.end('done');
});

 
// Router 2: goes to a page that can only be accessed
// if the user is logged in.
router.get('/admin', (req, res) => {
    temp = req.session;
    if (temp.username) {
        res.write(`<html>
        <head>
            <title>Modul 10 - SBD</title>
        </head>
        <body style="background-color: lightblue; text-align: center;">`);
        
        //tambahkan welcoming beserta username
        
        res.write(
        `<h1> Welcome ${temp.username} </h1>
        <a> Jumlah kunjungan ${temp.visits}</a>
        <h5>Refresh page to increase visits</h5>
        `
        );
        temp.visits++;
        res.write( // table header
            `<table>
                <tr>
                    <th>id</th>
                    <th>kota</th>
                    <th>jumlah_kasus</th>
                </tr>`
        );
        const query = `select * from data_covid`;
        db.query(query, (err, results) => {
            if (err) {
                console.error(err.detail);
                res.send(err.detail)
                return;
            }
            for (row of results.rows) { // tampilin isi table
                res.write(
                    `
                    <tr> 
                    <td>${row['id']}</td>
                    <td>${row['kota']}</td>
                    <td>${row['jumlah_kasus']}</td>
                    <td><button id=del>Delete</button></td> //jika bagian ini ingin diubah, boleh
                    `
                );
                console.log(row);
            }    
            res.end(`</table></body>
            <script>
                    jQuery(document).ready(function($) {
                        

// isi dengan konfigurasi delete data berdasarkan id


                    });
                </script>
            </html>`);
            console.log('Data Fetch successful');
        });
        res.write('<a href=' + '/logout' + '>Click here to log out</a>');
    } 
    else {
        res.write('<h1>You need to log in before you can see this page.</h1>');
        res.end('<a href=' + '/' + '>Login</a>');
    }
});
 
//Router 4: mengheapus session
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return console.log(err);
        }
        res.redirect('/');
    });
});
 
app.use('/', router);
app.listen(process.env.PORT || 3000, () => {
    console.log(`App Started on PORT ${process.env.PORT || 3000}`);
});