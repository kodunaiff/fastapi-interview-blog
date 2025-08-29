// protected.js

(function checkAuth() {
    if (!isAuthenticated()) {
        window.location.href = "/static/templates/login.html";
    }
})();