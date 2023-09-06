const username = document.getElementById("username");
const submitLoginBtn = document.getElementById("loginaction");
const alertText = document.getElementById("alert");
const logoutbtn = document.getElementById("logout");
const logincontainer = document.getElementById("login");

const email = document.getElementById("email");
const pwd = document.getElementById("pwd");

const baseURI = "http://regimen.localhost/"

submitLoginBtn.addEventListener("click", () => {
    const data = {
        "username": email.value,
        "password": pwd.value
    }
    email.disabled = true
    pwd.disabled = true
    submitLoginBtn.disabled = true
    alertText.textContent = ""
    logincontainer.classList.add("waiting")

    fetch(`${baseURI}wp-json/jwt-auth/v1/token`, {
        body: JSON.stringify(data),
        method: "POST",
        headers: { "Content-type": "application/json; charset=UTF-8" }
    }).then(response => response.json())
        .then((json) => {
            alertText.removeAttribute("class")
            console.log(json)

            if (json.hasOwnProperty('data')) {
                alertText.innerHTML = json["message"];

                email.disabled = false
                pwd.disabled = false
                submitLoginBtn.disabled = false

                email.value = ""
                pwd.value = ""
                logincontainer.removeAttribute("class")
                return
            }
            username.textContent = `Hola, ${json["user_display_name"]}!`
            setCookie('token', json["token"], 7);

            username.removeAttribute("style");
            logoutbtn.removeAttribute("style");
            alertText.style = "display:none;"
            logincontainer.style = "display: none;"
            document.getElementById("announce").remove();
            document.getElementById("segment").removeAttribute("style");
        })
        .catch((err) => {
            alertText.innerHTML = "No se pudo establecer conexión con el servidor...";

            email.disabled = false
            pwd.disabled = false
            submitLoginBtn.disabled = false

            email.value = ""
            pwd.value = ""
            logincontainer.removeAttribute("class")
            return
        })
})


function setCookie(nombre, valor, diasExpiracion) {
    const fechaExpiracion = new Date();
    fechaExpiracion.setTime(fechaExpiracion.getTime() + (diasExpiracion * 24 * 60 * 60 * 1000));
    const fechaExpiracionUTC = fechaExpiracion.toUTCString();
    const cookieString = `${nombre}=${valor}; expires=${fechaExpiracionUTC}; path=/`;
    document.cookie = cookieString;
}

function getCookie(nombre) {
    const nombreCocina = nombre + "=";
    const cookies = document.cookie.split(';');

    for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i].trim();
        if (cookie.indexOf(nombreCocina) === 0) {
            return cookie.substring(nombreCocina.length, cookie.length);
        }
    }
    return null;
}

function deleteCookie(nombre) {
    document.cookie = `${nombre}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

if (getCookie("token") !== null) {
    email.disabled = true
    pwd.disabled = true
    submitLoginBtn.disabled = true

    alertText.textContent = "Espere, estamos verificando su sesión..."
    logincontainer.classList.add("waiting")

    fetch(`${baseURI}wp-json/wp/v2/users/me`, {
        method: "GET",
        headers: {
            "Content-type": "application/json; charset=UTF-8",
            'Authorization': `Bearer ${getCookie("token")}`
        }
    }).then(response => response.json())
        .then((json) => {
            console.log(json)
            if (json.hasOwnProperty('data')) {
                alertText.innerHTML = json["message"];

                email.disabled = false
                pwd.disabled = false
                submitLoginBtn.disabled = false

                email.value = ""
                pwd.value = ""
                logincontainer.removeAttribute("class")
                return
            }
            logincontainer.removeAttribute("class")
            username.textContent = `Hola, ${json["name"]}!`

            username.removeAttribute("style");
            logoutbtn.removeAttribute("style");
            alertText.style = "display:none;"
            logincontainer.style = "display: none;"
            document.getElementById("announce").remove();
            document.getElementById("segment").removeAttribute("style");
        })
        .catch((err) => {
            // nothing oviuliiiii
        })
}

logoutbtn.addEventListener('click', () => {
    deleteCookie("token");
    location.reload()
})