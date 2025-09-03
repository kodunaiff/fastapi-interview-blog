// static/js/features/users/profile.js

document.addEventListener("DOMContentLoaded", async () => {
    const res = await fetch("/api/v1/auth/me", {
        headers: { Authorization: `Bearer ${getToken()}` }
    });

    if (res.status === 401) {
        logout();
        return;
    }

    const user = await res.json();
    document.getElementById("user-email").innerText = `Email: ${user.email}`;
    document.getElementById("username").innerText = `username: ${user.username}`;

    document.getElementById("is-superuser").innerText =
        user.is_superuser ? "👑 Суперпользователь" : "👤 Обычный пользователь";
});