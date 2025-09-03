// static/js/features/posts/detail.js


document.addEventListener("DOMContentLoaded", async () => {
    await loadPostDetail();
});

async function loadPostDetail() {
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
            displayPostDetail(post);
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

function displayPostDetail(post) {
    const postDetail = document.getElementById("post-detail");

    postDetail.innerHTML = `
        <div style="border: 1px solid #ccc; padding: 20px; border-radius: 5px; max-width: 800px; margin: 0 auto;">
            <h2 style="margin: 0 0 20px 0;">${post.title}</h2>
            <div style="
                min-height: 200px;
                line-height: 1.6;
                font-size: 16px;
                white-space: pre-wrap;
                word-wrap: break-word;
                padding: 15px;
                border: 1px solid #eee;
                border-radius: 5px;
                background: #f9f9f9;
            ">${post.content}</div>

            <small>Создан: ${new Date(post.created_at).toLocaleDateString()}</small>
            ${post.tags && post.tags.length > 0 ?
                `<div><strong>Теги:</strong> ${post.tags.map(tag => tag.name).join(', ')}</div>` : ''}
            <br>
            <button onclick="editPost('${post.id}')">Редактировать</button>
            <button onclick="deletePost('${post.id}')">Удалить</button>
        </div>
    `;
}

function editPost(postId) {
    window.location.href = `/static/templates/posts/edit.html?id=${postId}`;
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
            setTimeout(() => window.location.href = '/static/templates/posts/list.html', 1000);
        } else {
            showMessage("Ошибка удаления", "red");
        }
    } catch (error) {
        console.error("Error deleting post:", error);
        showMessage("Ошибка сети", "red");
    }
}

function showMessage(text, color) {
    const messageDiv = document.getElementById("post-message");
    messageDiv.innerText = text;
    messageDiv.style.color = color;
}