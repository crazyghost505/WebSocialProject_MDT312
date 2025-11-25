window.onload = () => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");

    if (error == 1)
        document.getElementById('errordisplay').innerHTML = "Password incorrect for existing user.";
    else if (error == 2)
        document.getElementById('errordisplay').innerHTML = "Internal server error.";
};
