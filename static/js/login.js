// login.js

async function login(event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            username: username,
            email: email,
            password: password,
        }),
    });

    const errorElement = document.getElementById("error");

    if (response.ok) {
        const data = await response.json();
        setToken(data.access_token);
        window.location.href = "/static/templates/dashboard.html";
    } else {
        errorElement.innerText = "Неверный логин или пароль";
    }
}