// static/js/features/tags/edit.js

document.addEventListener("DOMContentLoaded", async () => {
    await loadTagForEdit();
    setupEditForm();
});

async function loadTagForEdit() {
    const tagId = getTagIdFromUrl();
    if (!tagId) {
        showMessage("Тег не найден", "red");
        return;
    }

    try {
        const response = await fetch(`/api/v1/tags/${tagId}`, {
            headers: {
                "Authorization": `Bearer ${getToken()}`
            }
        });

        if (response.status === 401) {
            logout();
            return;
        }

        if (response.ok) {
            const tag = await response.json();
            fillEditForm(tag);
        } else {
            showMessage("Тег не найден", "red");
        }

    } catch (error) {
        console.error("Error loading teg:", error);
        showMessage("Ошибка загрузки", "red");
    }
}

function getTagIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

function fillEditForm(tag) {
    document.getElementById("tag-name").value = tag.name;
}

function setupEditForm() {
    const form = document.getElementById("edit-tag-form");
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        await updateTag();
    });
}

async function updateTag() {
    const tagId = getTagIdFromUrl();
    const messageDiv = document.getElementById("tag-message");
    messageDiv.innerText = "";
    messageDiv.style.color = "";

    const name = document.getElementById("tag-name").value;

    if (!name) {
        showMessage("Имя тега обязательно!", "red");
        return;
    }

    try {
        const response = await fetch(`/api/v1/tags/${tagId}`, {
            method: "PATCH",
            headers: {
                "Authorization": `Bearer ${getToken()}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: name
            })
        });

        if (response.status === 401) {
            logout();
            return;
        }

        if (response.ok) {
            showMessage("Тег обновлен!", "green");
            setTimeout(() => window.location.href = '/static/templates/tags/list.html', 1000);
        } else {
            const error = await response.json();
            showMessage(`Ошибка: ${error.detail || "Неизвестная ошибка"}`, "red");
        }

    } catch (error) {
        console.error("Error updating tag:", error);
        showMessage("Ошибка сети. Попробуйте позже.", "red");
    }
}

function showMessage(text, color) {
    const messageDiv = document.getElementById("tag-message");
    messageDiv.innerText = text;
    messageDiv.style.color = color;
}
