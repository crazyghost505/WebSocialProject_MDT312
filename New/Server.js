const express = require("express");
const fs = require("fs");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

// โหลด UserDB.json
function loadUsers() {
  return JSON.parse(fs.readFileSync("UserDB.json", "utf8"));
}

// บันทึก UserDB.json
function saveUsers(data) {
  fs.writeFileSync("UserDB.json", JSON.stringify(data, null, 2));
}

// ------------------ REGISTER ------------------
app.post("/register", (req, res) => {
  const { username, password } = req.body;
  let users = loadUsers();

  const exist = users.find(u => u.username === username);

  if (exist) {
    return res.json({ status: "error", message: "User already exists" });
  }

  // สร้าง user ใหม่
  users.push({ username, password });
  saveUsers(users);

  res.json({ status: "success", message: "User registered" });
});

// ------------------ LOGIN ------------------
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  let users = loadUsers();

  const user = users.find(u => u.username === username);

  if (!user) {
    return res.json({ status: "need_register" });
  }

  if (user.password !== password) {
    return res.json({ status: "error", message: "Wrong password" });
  }

  // Login สำเร็จ
  res.json({ status: "success", message: "Login successful" });
});

// ------------------ START SERVER ------------------
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
