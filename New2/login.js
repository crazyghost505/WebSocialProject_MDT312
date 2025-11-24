// ไฟล์: js/login.js
window.onload = pageLoad;

function pageLoad(){
    // -------------------------------------------------------------
    // *** ส่วนที่ต้องแก้ไข/ตรวจสอบ: กำหนด Event Listener ให้ปุ่ม ***
    // -------------------------------------------------------------
    // ปุ่ม "ยังไม่มีบัญชี? ลงทะเบียนที่นี่" (ในฟอร์ม Login)
    const switchRegisButton = document.getElementById('switchRegisButton');
    if (switchRegisButton) {
        switchRegisButton.onclick = showRegisterForm;
    }

    // ปุ่ม "มีบัญชีอยู่แล้ว? เข้าสู่ระบบ" (ในฟอร์ม Register)
    const switchLoginButton = document.getElementById('switchLoginButton');
    if (switchLoginButton) {
        switchLoginButton.onclick = showLoginForm;
    }
    // -------------------------------------------------------------
    
	const queryString = window.location.search;
	const urlParams = new URLSearchParams(queryString);
    
    // Logic การจัดการ Error
	if (urlParams.get("error")==1){
        const errordisplay = document.getElementById('errordisplay');
        if (!errordisplay) return; // ออกจากฟังก์ชันถ้าไม่มี element แสดง error
        
        // ถ้ามี error, ให้แสดงฟอร์ม Register ไว้ก่อน (เพราะมักเกิดจาก Register ซ้ำ)
        showRegisterForm(); 

        // แสดงข้อความ error
        document.getElementById('errordisplay').innerHTML = "Registration Error! (Username already taken) หรือ Username/Password ไม่ถูกต้อง";
        
	} else {
        // หากไม่มี Error ให้แสดงฟอร์ม Login เป็นค่าเริ่มต้น
        showLoginForm(); 
    }
}

// ฟังก์ชันสำหรับแสดงฟอร์ม Login
function showLoginForm() {
    // ซ่อนฟอร์ม Register
    const registerForm = document.getElementById('registerForm');
    if (registerForm) registerForm.style.display = 'none';
    
    // แสดงฟอร์ม Login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.style.display = 'block';
    
    // ล้างข้อความ Error
    const errordisplay = document.getElementById('errordisplay');
    if (errordisplay) errordisplay.innerHTML = "";
}

// ฟังก์ชันสำหรับแสดงฟอร์ม Register
function showRegisterForm() {
    // ซ่อนฟอร์ม Login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.style.display = 'none';

    // แสดงฟอร์ม Register
    const registerForm = document.getElementById('registerForm');
    if (registerForm) registerForm.style.display = 'block';

    // ล้างข้อความ Error
    const errordisplay = document.getElementById('errordisplay');
    if (errordisplay) errordisplay.innerHTML = "";
}