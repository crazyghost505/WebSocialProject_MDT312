async function submitLogin() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  // 1. ส่งไปเช็ค login ก่อน
  let res = await fetch("http://localhost:3000/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  let data = await res.json();

  // ไม่มีไอดี → register ก่อน
  if (data.status === "need_register") {
    document.getElementById("msg").innerText = "User not found. Registering...";

    let registerRes = await fetch("http://localhost:3000/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    let regData = await registerRes.json();

    if (regData.status === "success") {
      localStorage.setItem("logged_in_user", username);
      window.location.href = "dashboard.html";
    }
    return;
  }

  // password ผิด
  if (data.status === "error") {
    document.getElementById("msg").innerText = data.message;
    return;
  }

  // login สำเร็จ
  if (data.status === "success") {
    localStorage.setItem("logged_in_user", username);
    window.location.href = "dashboard.html";
  }
}
