const express = require('express');
const app = express();
const fs = require('fs');
const hostname = 'localhost';
const port = 3000;
const bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
const multer = require('multer');
const path = require('path');
const userDBPath = path.join(__dirname, 'js', 'userDB.json');
const postDBPath = path.join(__dirname, 'js', 'postDB.json'); //หา directory ไม่เจอ
app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

// --- Multer Configuration ---
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
      // The 'img/' directory must exist
      callback(null, 'img/'); 
    },
    filename: (req, file, cb) => {
        // Create a unique filename
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
// ------------------------------


// --- ROUTES ---

// Handle profile picture upload
// We use 'upload.single('avatar')' as middleware
// 'fileField' MUST match the 'name' attribute of your file input in the HTML form
app.post('/profilepic', upload.single('avatar'), async (req, res) => {
    try {
        // 1. Get username from the cookie (they must be logged in to upload)
        const username = req.cookies.username;
        
        // 2. Check if a file was actually uploaded
        if (!req.file) {
            console.log("No file uploaded.");
            return res.redirect('Dashboard.html');
        }
        
        // 3. Get the new filename created by multer
        const newFilename = req.file.filename;

        // 4. Update the users.json file with the new filename
        await updateImg(username, newFilename);

        // 5. Update the user's 'img' cookie to the new filename
        res.cookie('img', newFilename);

        // 6. Redirect back to the Dashboard
        return res.redirect('Dashboard.html');

    } catch (err) {
        console.error("Error uploading profile picture:", err);
        return res.redirect('Dashboard.html');
    }
});


// Handle user logout
app.get('/logout', (req, res) => {
    res.clearCookie('username');
    res.clearCookie('img');
    return res.redirect('index.html');
});


// Handle reading all posts
app.get('/readPost', async (req, res) => {
    try {
        // 'readJson' is your special function that reads and parses the file
        // 'postDBPath' is your path.join() variable for postDB.json
        const posts = await readJson(postDBPath); 

        // 🚨 THIS IS THE MOST IMPORTANT LINE 🚨
        // You MUST send the 'posts' data back as JSON
        res.json(posts); 
        
    } catch (err) {
        // If it fails, send an error
        console.error("Error in /readPost:", err);
        res.status(500).json({ error: "Failed to read posts" });
    }
});


// Handle writing a new post
app.post('/writePost', async (req, res) => {
   try {
    // 1. Read the OLD posts (this is what was failing)
    // 'posts' will be an object: { "post1": {...}, "post2": {...} }
    const posts = await readJson(postDBPath);

    // 2. Create the new post
    const newPost = {
        user: req.body.user, // or wherever you get the user from
        message: req.body.message
    };

    // 3. Add it to the object with a new key
    // (This is a simple way to create a new ID like "post3")
    const newPostId = `post${Object.keys(posts).length + 1}`;
    posts[newPostId] = newPost;

    // 4. 🚨 THIS IS THE FIX 🚨
    // Convert the entire 'posts' object back into a JSON string
    const dataToWrite = JSON.stringify(posts, null, 2); // (null, 2) makes it look nice

    // 5. Write the new string back to the file
    fs.writeFile(postDBPath, dataToWrite, (err) => {
    if (err) {
        // Also send errors as JSON
        res.status(500).json({ error: "Error writing to file" });
    } else {
        // Send success as JSON
        res.json({ message: "Post successful!" }); // 👈 FIX IS HERE
    }
    });

} catch (err) {
    console.error("Error in /writePost handler:", err);
    res.status(500).send("Server error");
}
});


// Handle user login
app.post('/checkLogin', async (req, res) => {
    try {
        const { username, password } = req.body;
        const usersObject = await readJson(userDBPath); 

        // 1. Convert the object's values into an array
        const usersArray = Object.values(usersObject);

        // 2. Now, you can use .find() on the new array!
        const foundUser = usersArray.find(u => u.username === username);

        if (foundUser && foundUser.password === password) {
            // Success: Set cookies
            res.cookie('username', foundUser.username);
            res.cookie('img', foundUser.img);
            return res.redirect('Dashboard.html');
        } else {
            // Failure: Redirect with error
            return res.redirect('index.html?error=1');
        }
    } catch (err) {
        console.error("Error during login:", err);
        return res.redirect('index.html?error=1');
    }
});


// --- HELPER FUNCTIONS (for reading/writing files) ---

// Generic function to read any JSON file
const readJson = (file_name) => {
    return new Promise((resolve, reject) => {
        fs.readFile(file_name, 'utf8', (err, data) => { 
            if (err) { 
                // If the file can't be read, reject
                reject(err); 
                return; // Stop execution
            } 
            
            if (data === "") {
                // If the file is empty, resolve with a real EMPTY ARRAY
                resolve([]); 
            } else {
                try {
                    // Try to parse the string into real JSON
                    const parsedData = JSON.parse(data);
                    // Resolve with the parsed array/object
                    resolve(parsedData); 
                } catch (parseError) {
                    // If the JSON is invalid (e.g., syntax error)
                    reject(parseError);
                }
            }
        });
    });
};


// Generic function to write any data to a JSON file
const writeJson = (data, file_name) => {
    return new Promise((resolve, reject) => {
        // Convert JS data to a formatted JSON string
        const jsonData = JSON.stringify(data, null, 2); 
        fs.writeFile(file_name, jsonData, (err) => { 
            if (err) { 
                reject(err);
            } else {
                resolve("saved!");
            }
        });
    });
};


// Function to update a user's image in users.json
const updateImg = async (username, fileimg) => {
    try {
        // 1. Read all user data
        const usersData = await readJson(userDBPath);
        let users = JSON.parse(usersData);

        // 2. Find the index of the user to update
        const userIndex = users.findIndex(user => user.username === username);

        if (userIndex !== -1) {
            // 3. Update the 'img' property for that user
            users[userIndex].img = fileimg;
        } else {
            console.log(`User '${username}' not found for img update.`);
            return; // Exit if user not found
        }
        
        // 4. Write the *entire* modified user array back to the file
        await writeJson(users, './js/userDB.json');
        console.log(`Updated image for ${username} to ${fileimg}`);

    } catch (err) {
        console.error("Error in updateImg:", err);
    }
};
app.post('/loginOrRegister', async (req, res) => {
    try {
        const { username, password } = req.body;

        // โหลด userDB
        const users = await readJson(userDBPath);
        const userList = Object.values(users);

        // ค้นหาว่ามี username นี้แล้วหรือยัง
        const foundUser = userList.find(u => u.username === username);

        // ---------- CASE 1: มี user อยู่แล้ว ----------
        if (foundUser) {
            if (foundUser.password === password) {
                // password ตรง → login ได้เลย
                res.cookie('username', foundUser.username);
                res.cookie('img', foundUser.img);
                return res.redirect('Dashboard.html');
            } else {
                // password ไม่ตรง → แจ้งว่าเคยลงทะเบียนแล้ว
                return res.redirect('index.html?error=1');
            }
        }

        // ---------- CASE 2: user ใหม่ → register อัตโนมัติ ----------
        const newId = `user${Object.keys(users).length + 1}`;

        users[newId] = {
            username,
            password,
            img: "avatar.png"
        };

        // เขียนข้อมูลลงไฟล์
        await writeJson(users, userDBPath);

        // ตั้ง cookie และเข้า Dashboard ได้ทันที
        res.cookie('username', username);
        res.cookie('img', 'avatar.png');

        return res.redirect('Dashboard.html');

    } catch (err) {
        console.error("Login/Register error:", err);
        return res.redirect('index.html?error=2');
    }
});

app.get('/getUserProfile', async (req, res) => {
    try {
        const username = req.query.username;
        const users = await readJson(userDBPath);

        const found = Object.values(users).find(u => u.username === username);

        if (!found) {
            return res.status(404).json({ error: "User Not Found" });
        }

        res.json(found);
    } catch (err) {
        res.status(500).json({ error: "Server Error" });
    }
});



app.listen(port, hostname, () => {
    console.log(`Server running at   http://${hostname}:${port}/`);
});
