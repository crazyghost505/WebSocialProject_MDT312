// check ว่ามีการ set cookies หรือยังถ้ามีจะไปยัง feed.html แต่ถ้าไม่มีจะกลับไปที่ index.html
function checkCookie(){
    var username = getCookie("username"); // <-- FIX: Get username first
    if(username === ""){ // <-- FIX: Check for an empty string, not false
        window.location = "index.html";
    }
}

checkCookie();
window.onload = pageLoad;

function getCookie(name){
    var value = "";
    try{
        value = document.cookie.split("; ").find(row => row.startsWith(name)).split('=')[1]
        return value
    }catch(err){
        return ""; // <-- FIX: Return an empty string on failure, NOT false
    } 
}

function pageLoad(){
    document.getElementById('postbutton').onclick = getData;

    document.getElementById('displayPic').onclick = fileUpload;
    document.getElementById('fileField').onchange = fileSubmit;
    
    var username = getCookie('username');
    // <-- FIX: Check if username is not empty before showing it
    if (username !== "") { 
        document.getElementById("username").innerHTML = username;
    }

    console.log(getCookie('img'));
    var imgCookie = getCookie('img'); // <-- FIX: Get img cookie
    // <-- FIX: Check if img cookie is not empty before showing it
    if (imgCookie !== "") { 
        showImg('img/' + imgCookie);
    }
    
    readPost(); // Call readPost on page load
}

function getData(){
    var msg = document.getElementById("textmsg").value;
    document.getElementById("textmsg").value = "";
    writePost(msg);
}

function fileUpload(){
    document.getElementById('fileField').click();
}

function fileSubmit(){
    document.getElementById('formId').submit();
}

// แสดงรูปในพื้นที่ที่กำหนด
function showImg(filename){
    if (filename !==""){
        var showpic = document.getElementById('displayPic');
        showpic.innerHTML = "";
        var temp = document.createElement("img");
        temp.src = filename;
        showpic.appendChild(temp);
    }
}

// อ่าน post จาก file
async function readPost(){
    try {
        let response = await fetch("/readPost"); 
        if(response.ok){
            let data = await response.json();
            showPost(data); // Use showPost to display the feed
        }
    } catch (err) {
        console.error("Error reading posts:", err);
    }
}

// เขียน post ใหม่ ลงไปใน file
async function writePost(msg){
    var username = getCookie('username'); // <-- This is now safe because checkCookie() ran

    // This part creates the message object
    let msgObject = {
        user: username,
        message: msg
    };

    // This fetch request is correct and should not be changed.
    // It was failing because 'username' was 'false'.
    try {
        let response = await fetch("/writePost", { 
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(msgObject)
        });
        
        if (response.ok) {
            // After posting, we must reload the feed
            readPost(); // <-- FIX: Reload posts AFTER successful write
        } else {
            // Handle server errors (like 400, 500)
            console.error("Server responded with an error:", response.status);
        }

    } catch (err) {
        console.error("Error writing post:", err);
    }
}

// แสดง post ที่อ่านมาได้ ลงในพื้นที่ที่กำหนด
function showPost(data){
    var keys = Object.keys(data);
    var divTag = document.getElementById("feed-container");
    divTag.innerHTML = "";
    for (var i = keys.length-1; i >=0 ; i--) {

        var temp = document.createElement("div");
        temp.className = "newsfeed";
        divTag.appendChild(temp);
        var temp1 = document.createElement("div");
        temp1.className = "postmsg";
        
        // <-- FIX: Check for undefined data, just in case
        temp1.innerHTML = data[keys[i]]["message"] || "No message"; 
        temp.appendChild(temp1);
        
        var temp1 = document.createElement("div");
        temp1.className = "postuser";
        
        // <-- FIX: Check for undefined data, just in case
        temp1.innerHTML = "Posted by: " + (data[keys[i]]["user"] || "Unknown user"); 
        temp.appendChild(temp1);
    }
}