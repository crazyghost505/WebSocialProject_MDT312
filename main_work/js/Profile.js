window.onload = loadProfile;

async function loadProfile() {
    let username = getCookie("username");

    let res = await fetch(`/getUserProfile?username=${username}`);
    let user = await res.json();

    document.querySelector(".profile-image-large").src = "img/" + user.img;
    document.querySelector(".profile-username").innerHTML = user.username;
    document.querySelector(".profile-tagline").innerHTML = user.tagline;

    let tagContainer = document.querySelector(".profile-tags");
    tagContainer.innerHTML = "";
    user.tags.forEach(t => {
        let span = document.createElement("span");
        span.className = "tag";
        span.innerHTML = t;
        tagContainer.appendChild(span);
    });

    // Decks
    let deckRow = document.querySelector(".thumbnail-row");
    deckRow.innerHTML = "";
    user.decks.forEach(d => {
        let img = document.createElement("img");
        img.className = "thumbnail-image";
        img.src = "img/" + d;
        deckRow.appendChild(img);
    });

    document.querySelector(".discord").innerHTML = user.discord;
    document.querySelector(".email").innerHTML = user.email;
}

// get cookie
function getCookie(name) {
    let x = document.cookie.split("; ").find(row => row.startsWith(name));
    return x ? x.split("=")[1] : "";
}
