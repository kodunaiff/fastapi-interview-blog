// static/js/features/posts/create.js

document.addEventListener("DOMContentLoaded", async () => {
    setupPostForm();
});

// Настройка формы создания поста
function setupPostForm() {
    const form = document.getElementById("create-post-form");
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        await createPost();
    });
}

// Создание поста
async function createPost() {
    const messageDiv = document.getElementById("post-message");
    messageDiv.innerText = "";
    messageDiv.style.color = "";

    const title = document.getElementById("post-title").value;
    const content = document.getElementById("post-content").value;
    const tagsInput = document.getElementById("post-tags").value;

    if (!title || !content) {
        showMessage("Заголовок и содержание обязательны!", "red");
        return;
    }

    try {
        const response = await fetch("/api/v1/posts", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${getToken()}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title: title,
                content: content,
                tag_ids: await processTags(tagsInput)
            })
        });

        if (response.status === 401) {
            logout();
            return;
        }

        if (response.ok) {
            showMessage("Пост успешно создан!", "green");
            // Очищаем форму
            document.getElementById("create-post-form").reset();
        } else {
            const error = await response.json();
            showMessage(`Ошибка: ${error.detail || "Неизвестная ошибка"}`, "red");
        }

    } catch (error) {
        console.error("Error creating post:", error);
        showMessage("Ошибка сети. Попробуйте позже.", "red");
    }
}

// Обработка тегов
async function processTags(tagsInput) {
    const names = Array.from(
        new Set(
            tagsInput.split(",").map((t) => t.trim()).filter(Boolean)
        )
    );
    if (!names.length) return [];

    try {
        const res = await fetch("/api/v1/tags/resolve", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${getToken()}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ names })
        });

        if (res.status === 401) {
            logout();
            return [];
        }

        if (!res.ok) {
            console.error("Resolve tags failed", res.status);
            return [];
        }

        const data = await res.json(); // { ids: [...] }
        return data.ids;
    } catch (e) {
        console.error("Error resolving tags:", e);
        return [];
    }
}

// Вспомогательная функция для сообщений
function showMessage(text, color) {
    const messageDiv = document.getElementById("post-message");
    messageDiv.innerText = text;
    messageDiv.style.color = color;
}

