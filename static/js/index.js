// static/js/index.js

document.addEventListener("DOMContentLoaded", async () => {
    await loadPosts();
    await loadAllPosts();
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
            // Перезагружаем список постов
            await loadPosts();
        } else {
            const error = await response.json();
            showMessage(`Ошибка: ${error.detail || "Неизвестная ошибка"}`, "red");
        }

    } catch (error) {
        console.error("Error creating post:", error);
        showMessage("Ошибка сети. Попробуйте позже.", "red");
    }
}

// Обработка тегов (если нужно преобразовать в UUID)
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

// Загрузка постов пользователя
async function loadPosts() {
    try {
        const response = await fetch("/api/v1/posts/me?limit=20", {
            headers: {
                "Authorization": `Bearer ${getToken()}`
            }
        });

        if (response.status === 401) {
            logout();
            return;
        }

        if (response.ok) {
            const posts = await response.json();
            displayPosts(posts);
        } else {
            console.error("Error loading posts:", response.status);
        }

    } catch (error) {
        console.error("Error loading posts:", error);
    }
}

async function loadAllPosts() {
    try {
        const response = await fetch("/api/v1/posts/?limit=20", {
            headers: {
                "Authorization": `Bearer ${getToken()}`
            }
        });

        if (response.status === 401) {
            logout();
            return;
        }

        if (response.ok) {
            const posts = await response.json();
            displayAllPosts(posts);
        } else {
            console.error("Error loading posts:", response.status);
        }

    } catch (error) {
        console.error("Error loading posts:", error);
    }
}

// Отображение постов
function displayPosts(posts) {
    const postsList = document.getElementById("posts-list");

    if (posts.length === 0) {
        postsList.innerHTML = "<p>У вас пока нет постов</p>";
        return;
    }

    postsList.innerHTML = posts.map(post => `
        <div style="border: 1px solid #ccc; padding: 15px; margin: 10px 0; border-radius: 5px;">
            <h3>${post.title}</h3>
            <p>${post.content}</p>
            <small>Создан: ${new Date(post.created_at).toLocaleDateString()}</small>
            ${post.tags && post.tags.length > 0 ?
                `<div>Теги: ${post.tags.map(tag => tag.name).join(', ')}</div>` : ''}
            <button onclick="editPost('${post.id}')">Редактировать</button>
            <button onclick="deletePost('${post.id}')">Удалить</button>
        </div>
    `).join('');
}

// Отображение постов
function displayAllPosts(posts) {
    const postsList = document.getElementById("posts-all-list");

    if (posts.length === 0) {
        postsList.innerHTML = "<p>У вас пока нет постов</p>";
        return;
    }

    postsList.innerHTML = posts.map(post => `
        <div style="border: 1px solid #ccc; padding: 15px; margin: 10px 0; border-radius: 5px;">
            <h3>${post.title}</h3>
            <p>${post.content}</p>
            <small>Создан: ${new Date(post.created_at).toLocaleDateString()}</small>
            ${post.tags && post.tags.length > 0 ?
                `<div>Теги: ${post.tags.map(tag => tag.name).join(', ')}</div>` : ''}
            <button onclick="editPost('${post.id}')">Редактировать</button>
            <button onclick="deletePost('${post.id}')">Удалить</button>
        </div>
    `).join('');
}

// Вспомогательная функция для сообщений
function showMessage(text, color) {
    const messageDiv = document.getElementById("post-message");
    messageDiv.innerText = text;
    messageDiv.style.color = color;
}

// Функции редактирования и удаления (можно добавить позже)
async function editPost(postId) {
    console.log("Edit post:", postId);
    // Реализация редактирования
}

async function deletePost(postId) {
    if (!confirm("Удалить этот пост?")) return;

    try {
        const response = await fetch(`/api/v1/posts/${postId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${getToken()}`
            }
        });

        if (response.status === 204) {
            showMessage("Пост удален", "green");
            await loadPosts();
        } else {
            showMessage("Ошибка удаления", "red");
        }
    } catch (error) {
        console.error("Error deleting post:", error);
        showMessage("Ошибка сети", "red");
    }
}
