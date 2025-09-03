// static/js/core/protected.js

(function checkAuth() {
    if (!isAuthenticated()) {
        window.location.href = "/static/templates/auth/login.html";
    }
})();