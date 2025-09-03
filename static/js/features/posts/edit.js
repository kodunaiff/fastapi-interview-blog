// static/js/features/posts/edit.js

document.addEventListener("DOMContentLoaded", async () => {
    await loadPostForEdit();
    setupEditForm();
});

async function loadPostForEdit() {
    const postId = getPostIdFromUrl();
    if (!postId) {
        showMessage("Пост не найден", "red");
        return;
    }

    try {
        const response = await fetch(`/api/v1/posts/${postId}`, {
            headers: {
                "Authorization": `Bearer ${getToken()}`
            }
        });

        if (response.status === 401) {
            logout();
            return;
        }

        if (response.ok) {
            const post = await response.json();
            fillEditForm(post);
        } else {
            showMessage("Пост не найден", "red");
        }

    } catch (error) {
        console.error("Error loading post:", error);
        showMessage("Ошибка загрузки", "red");
    }
}

function getPostIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

function fillEditForm(post) {
    document.getElementById("post-title").value = post.title;
    document.getElementById("post-content").value = post.content;
    document.getElementById("post-tags").value = post.tags ? post.tags.map(tag => tag.name).join(', ') : '';
}

function setupEditForm() {
    const form = document.getElementById("edit-post-form");
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        await updatePost();
    });
}

async function updatePost() {
    const postId = getPostIdFromUrl();
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
        const response = await fetch(`/api/v1/posts/${postId}`, {
            method: "PATCH",
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
            showMessage("Пост обновлен!", "green");
            setTimeout(() => window.location.href = '/static/templates/posts/list.html', 1000);
        } else {
            const error = await response.json();
            showMessage(`Ошибка: ${error.detail || "Неизвестная ошибка"}`, "red");
        }

    } catch (error) {
        console.error("Error updating post:", error);
        showMessage("Ошибка сети. Попробуйте позже.", "red");
    }
}

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

        if (!res.ok) return [];

        const data = await res.json();
        return data.ids;
    } catch (e) {
        console.error("Error resolving tags:", e);
        return [];
    }
}

function showMessage(text, color) {
    const messageDiv = document.getElementById("post-message");
    messageDiv.innerText = text;
    messageDiv.style.color = color;
}