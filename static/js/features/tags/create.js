// static/js/features/tags/create.js

document.addEventListener("DOMContentLoaded", async () => {
    setupTagForm();
});

// Настройка формы создания тэга
function setupTagForm() {
    const form = document.getElementById("create-tag-form");
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        await createTag();
    });
}

// Создание поста
async function createTag() {
    const messageDiv = document.getElementById("tag-message");
    messageDiv.innerText = "";
    messageDiv.style.color = "";

    const name = document.getElementById("tag-name").value;

    if (!name) {
        showMessage("Имя тега обязательно!", "red");
        return;
    }

    try {
        const response = await fetch("/api/v1/tags", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${getToken()}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: name,
            })
        });

        if (response.status === 401) {
            logout();
            return;
        }

        if (response.ok) {
            showMessage("Тег успешно создан!", "green");
            // Очищаем форму
            document.getElementById("create-tag-form").reset();
        } else {
            const error = await response.json();
            showMessage(`Ошибка: ${error.detail || "Неизвестная ошибка"}`, "red");
        }

    } catch (error) {
        console.error("Error creating tag:", error);
        showMessage("Ошибка сети. Попробуйте позже.", "red");
    }
}


// Вспомогательная функция для сообщений
function showMessage(text, color) {
    const messageDiv = document.getElementById("tag-message");
    messageDiv.innerText = text;
    messageDiv.style.color = color;
}
