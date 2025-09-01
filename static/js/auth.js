// auth.js

function setToken(token) {
    localStorage.setItem('access_token', token);
}

function getToken() {
    return localStorage.getItem('access_token');
}

function removeToken() {
    localStorage.removeItem('access_token');
}

function isAuthenticated() {
    return !!getToken();
}

async function logout() {
    const token = getToken();
    if (!token) return;

    await fetch('/api/v1/auth/logout', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    removeToken();
    window.location.href = '/static/templates/auth/login.html';
}
