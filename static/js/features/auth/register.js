// static/js/features/auth/register.js

async function register(event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const response = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password }),
    });

    const msg = document.getElementById('message');

    if (response.ok) {
        msg.style.color = 'green';
        msg.innerText = "Успешно! Перейдите на почту для верификации.";

    } else {
        const error = await response.json();
        msg.style.color = 'red';
        msg.innerText = error.detail || "Ошибка регистрации";
    }
}
