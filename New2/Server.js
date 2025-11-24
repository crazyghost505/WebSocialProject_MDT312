// ไฟล์: server.js
const express = require('express');
const app = express();
const fs = require('fs');
const hostname = 'localhost';
const port = 3000;
const bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
const multer = require('multer');
const path = require('path');
// const mysql = require('mysql'); // *** ไม่ใช้แล้ว ***

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

// --- Database Configuration (JSON) ---
const DB_FILE = 'UserDB.json'; 

// ฟังก์ชันสำหรับอ่านข้อมูลจาก JSON (Sync for simplicity)
const readDB = () => {
    try {
        if (!fs.existsSync(DB_FILE)) {
            // สร้างไฟล์เริ่มต้นหากยังไม่มี
            writeDB({ users: [], posts: [] });
            return { users: [], posts: [] };
        }
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error("Error reading database file, returning empty structure:", err);
        return { users: [], posts: [] };
    }
};

// ฟังก์ชันสำหรับเขียนข้อมูลลงใน JSON (Sync)
const writeDB = (data) => {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Error writing database file:", err);
    }
};


// --- Multer Configuration ---
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

// Create the multer upload instance
const upload = multer({ storage: storage, fileFilter: imageFilter });

//--- ROUTES ---

// (Register) รับข้อมูลผู้ใช้และบันทึกใน JSON
app.post('/regisDB', (req,res) => {
    let now_date = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const { username, email, password } = req.body;

    let db = readDB();

    // 1. ตรวจสอบ Username ซ้ำ (จำลอง UNIQUE constraint)
    const userExists = db.users.some(user => user.username === username);
    if (userExists) {
        console.log("Registration fail: Username already exists");
        return res.redirect('auth.html?error=1');
    }

    // 2. เพิ่มผู้ใช้ใหม่ลงใน Array
    const newUser = {
        id: db.users.length + 1, // กำหนด ID
        reg_date: now_date,
        username: username,
        email: email,
        password: password, // *Note: ใน Production ควรใช้ Hashing เช่น bcrypt
        img: "default.png"
    };
    db.users.push(newUser);

    // 3. บันทึก JSON
    writeDB(db);
    console.log("New user registered successfully:", newUser.username);
    return res.redirect('auth.html');
});

// (Check Login) ตรวจสอบ Username/Password จาก JSON
app.post('/checkLogin', (req,res) => {
    const { username, password } = req.body;
    let db = readDB();

    // 1. ค้นหาผู้ใช้
    const foundUser = db.users.find(user => user.username === username);

    // 2. ตรวจสอบผู้ใช้และรหัสผ่าน
    if (foundUser && foundUser.password === password) {
        // Success! Set cookies
        console.log("Login success:", foundUser.username);
        res.cookie('username', foundUser.username);
        res.cookie('img', foundUser.img); // Store image path in cookie
        return res.redirect('feed.html');
    } else {
        // Login ไม่สำเร็จ
        console.log("Login fail: wrong username or password");
       return res.redirect('auth.html?error=1');
    }
});


// (Profile Picture Upload) อัปโหลดรูปและอัปเดต JSON
app.post('/profilepic', upload.single('avatar'), (req,res) => {
    try {
        const username = req.cookies.username;
        
        // Check if a file was actually uploaded
        if (!req.file) {
            console.log("No file uploaded.");
            return res.redirect('feed.html');
        }
        
        const newFilename = req.file.filename;

        // อัปเดตข้อมูลใน JSON
        updateImgJSON(username, newFilename);

        // Update the user's 'img' cookie
        res.cookie('img', newFilename);
        return res.redirect('feed.html');

    } catch (err) {
        console.error("Error uploading profile picture:", err);
        return res.redirect('feed.html');
    }
});

// (Helper Function) ฟังก์ชันสำหรับอัปเดต JSON
const updateImgJSON = (username, filen) => {
    let db = readDB();
    const userIndex = db.users.findIndex(user => user.username === username);
    
    if (userIndex !== -1) {
        db.users[userIndex].img = filen;
        writeDB(db);
        console.log(`Image path updated in JSON for user: ${username}`);
    } else {
        console.error(`User not found in JSON for image update: ${username}`);
    }
}

// (Logout) ล้างคุกกี้
app.get('/logout', (req,res) => {
    res.clearCookie('username');
    res.clearCookie('img');
    return res.redirect('auth.html');
});

// (Read Posts) อ่าน post ทั้งหมดจาก JSON
app.get('/readPost', (req,res) => {
    try {
        let db = readDB();
        // ส่ง posts array กลับไป (Note: โค้ดเดิมใช้ Object.assign({}, result); เพื่อให้เข้ากับโครงสร้างของ MySQL result)
        // เพื่อให้เข้ากับโค้ด Frontend (showPost) เดิมที่วนลูปผ่าน Object Keys เราจะคงรูปแบบนี้ไว้
        
        // 1. เรียงโพสต์จากใหม่ไปเก่า (ตาม post_date)
        const sortedPosts = [...db.posts].sort((a, b) => new Date(a.post_date) - new Date(b.post_date));

        // 2. แปลง Array เป็น Object (Index-based) เพื่อให้เข้ากับ showPost(data)
        const resultObject = Object.assign({}, sortedPosts); 
        
        res.json(resultObject);
        
    } catch (err) {
        console.error("Error reading posts from JSON:", err);
        res.status(500).json({ error: "Failed to read posts" });
    }
});

// (Write Post) เขียน post ใหม่ลง JSON database
app.post('/writePost', (req,res) => {
    try {
        const { user, message } = req.body;
        let db = readDB();
        
        const newPost = {
            id: db.posts.length + 1,
            user: user,
            message: message,
            post_date: new Date().toISOString()
        };

        db.posts.push(newPost);
        writeDB(db); // บันทึก JSON

        res.json({ message: "Post successful!" });

    } catch (err) {
        console.error("Error writing post:", err);
        res.status(500).json({ error: "Failed to write post" });
    }
});


app.listen(port, hostname, () => {
 console.log(`Server running at http://${hostname}:${port}/auth.html`);
});