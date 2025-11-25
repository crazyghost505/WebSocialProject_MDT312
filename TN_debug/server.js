const express = require('express');
const app = express();
const fs = require('fs');
const hostname = 'localhost';
const port = 3000;
const bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
const multer = require('multer');
const path = require('path');
const mysql = require('mysql');

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
      callback(null, 'public/img/');
    },

    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
  });

const imageFilter = (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
        req.fileValidationError = 'Only image files are allowed!';
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

// ใส่ค่าตามที่เราตั้งไว้ใน mysql (กรุณาเปลี่ยนเป็นค่าของคุณ)
const con = mysql.createConnection({
    host: "localhost",
    user: "tn",
    password: "2716",
    database: "assignment12"
})

con.connect(err => {
    if(err) throw(err);
    else{
        console.log("MySQL connected");
        // เรียกใช้ฟังก์ชันสร้างตารางเมื่อเชื่อมต่อสำเร็จ
        createTables();
    }
})

const queryDB = (sql) => {
    return new Promise((resolve,reject) => {
        // query method
        con.query(sql, (err,result, fields) => {
            if (err) reject(err);
            else
                resolve(result)
        })
    })
}

// ฟังก์ชันสร้างตาราง users และ posts
const createTables = async () => {
    const createUserTableSQL = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            email VARCHAR(255) NOT NULL,
            password VARCHAR(255) NOT NULL,
            avatar VARCHAR(255) DEFAULT 'avatar.png',
            regis_date DATETIME NOT NULL
        )
    `;
    
    const createPostTableSQL = `
        CREATE TABLE IF NOT EXISTS posts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            message TEXT NOT NULL,
            user VARCHAR(255) NOT NULL,
            post_date DATETIME NOT NULL
        )
    `;

    try {
        await queryDB(createUserTableSQL);
        console.log("Table 'users' checked/created.");
        await queryDB(createPostTableSQL);
        console.log("Table 'posts' checked/created.");
    } catch (err) {
        console.error("Error creating tables:", err);
    }
}

// Uploader สำหรับ Profile Pic
var upload = multer({ storage: storage, fileFilter: imageFilter });


//ทำให้สมบูรณ์
app.post('/regisDB', async (req,res) => {
    let now_date = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const { username, email, password } = req.body;
    
    const defaultAvatar = 'avatar.png';
    const sql = `INSERT INTO users (username, email, password, avatar, regis_date) VALUES ('${username}', '${email}', '${password}', '${defaultAvatar}', '${now_date}')`;
    
    try {
        await queryDB(sql);
        return res.redirect('login.html');
    } catch(err) {
        console.error(err);
        return res.redirect('register.html?error=1');
    }
})

//ทำให้สมบูรณ์
app.post('/profilepic', upload.single('avatar'), async (req,res) => {
    if (req.file) {
        try {
            const username = req.cookies.username;
            const filen = req.file.filename;
            
            await updateImg(username, filen);
            
            res.cookie('img', filen);
            
            return res.redirect('feed.html');
            
        } catch(err) {
            console.error(err);
            return res.redirect('feed.html?error=1');
        }
    } else {
        return res.redirect('feed.html?error=2');
    }
})

const updateImg = async (username, filen) => {
    const sql = `UPDATE users SET avatar = '${filen}' WHERE username = '${username}'`;
    return queryDB(sql);
}

//ทำให้สมบูรณ์
app.get('/logout', (req,res) => {
    res.clearCookie('username');
    res.clearCookie('img');
    
    return res.redirect('login.html');
})

//ทำให้สมบูรณ์
app.get('/readPost', async (req,res) => {
    const sql = `SELECT * FROM posts ORDER BY post_date DESC`;
    
    try {
        const result = await queryDB(sql);
        return res.json(result);
    } catch(err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to read posts" });
    }
})

//ทำให้สมบูรณ์
app.post('/writePost',async (req,res) => {
    const { message } = req.body;
    const username = req.cookies.username;
    let now_date = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    if (!username || !message) {
        return res.status(400).json({ error: "Username or message missing" });
    }
    
    const sql = `INSERT INTO posts (message, user, post_date) VALUES ('${message}', '${username}', '${now_date}')`;
    
    try {
        await queryDB(sql);
        return res.json({ success: true });
    } catch(err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to write post" });
    }
})

//ทำให้สมบูรณ์
app.post('/checkLogin',async (req,res) => {
    const { username, password } = req.body;
    
    const sql = `SELECT username, avatar FROM users WHERE username = '${username}' AND password = '${password}'`;
    
    try {
        const result = await queryDB(sql);
        
        if (result.length > 0) {
            const user = result[0];
            
            res.cookie('username', user.username);
            res.cookie('img', user.avatar);
            
            return res.redirect('feed.html');
        } else {
            return res.redirect('login.html?error=1');
        }
    } catch(err) {
        console.error(err);
        return res.redirect('login.html?error=1'); 
    }
})


 app.listen(port, hostname, () => {
        console.log(`Server running at   http://${hostname}:${port}/register.html`);
});