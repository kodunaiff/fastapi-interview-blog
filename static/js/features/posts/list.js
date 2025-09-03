// static/js/features/posts/list.js

document.addEventListener("DOMContentLoaded", async () => {
    await loadAllPosts();
});


async function loadAllPosts() {
    try {
        const response = await fetch("/api/v1/posts/", {
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
function displayAllPosts(posts) {
    const postsList = document.getElementById("posts-all");

    if (posts.length === 0) {
        postsList.innerHTML = "<p>У вас пока нет постов</p>";
        return;
    }

    postsList.innerHTML = posts.map(post => `
        <div style="border: 1px solid #ccc; padding: 15px; margin: 10px 0; border-radius: 5px; cursor: pointer;"
            onclick="openPostDetail('${post.id}')">
            <h3 style="margin: 0 0 10px 0;">${post.title}</h3>
            <p style="margin: 0 0 10px 0; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;">
            ${post.content}</p>
            <small style="color: #666;">Создан: ${new Date(post.created_at).toLocaleDateString()}</small>
            ${post.tags && post.tags.length > 0 ?
                `<div>Теги: ${post.tags.map(tag => tag.name).join(', ')}</div>` : ''}
            <button onclick="event.stopPropagation(); deletePost('${post.id}')">Удалить</button>
            <button onclick="event.stopPropagation(); openPostDetail('${post.id}')">Подробнее</button>
        </div>
    `).join('');
}

// Вспомогательная функция для сообщений
function showMessage(text, color) {
    const messageDiv = document.getElementById("post-message");
    messageDiv.innerText = text;
    messageDiv.style.color = color;
}

// Переход на детальную страницу
function openPostDetail(postId) {
    window.location.href = `/static/templates/posts/detail.html?id=${postId}`;
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
            await loadAllPosts();

        } else {
            showMessage("Ошибка удаления", "red");
        }
    } catch (error) {
        console.error("Error deleting post:", error);
        showMessage("Ошибка сети", "red");
    }
}
