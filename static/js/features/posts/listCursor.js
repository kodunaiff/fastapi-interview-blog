// static/js/features/posts/list.js

let currentCursor = null;
let isLoading = false;
let hasMore = true;

document.addEventListener("DOMContentLoaded", async () => {
    await loadPosts();
    setupInfiniteScroll();
});


async function loadPosts(cursor = null) {
    if (isLoading) return;
    isLoading = true;

    try {
        let url = "/api/v1/posts/cursor?limit=10";
        if (cursor) {
            url += `&cursor=${cursor}`;
        }

        const response = await fetch(url, {
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
            displayPosts(posts, !cursor); // !cursor = first load
            currentCursor = posts.length > 0 ? posts[posts.length - 1].id : null;
            hasMore = posts.length === 10; // Если пришло 10 постов, значит есть еще
        } else {
            console.error("Error loading posts:", response.status);
        }

    } catch (error) {
        console.error("Error loading posts:", error);
    } finally {
        isLoading = false;
    }
}

// Отображение постов
function displayPosts(posts, isFirstLoad = false) {
    const postsList = document.getElementById("posts-all");

    if (isFirstLoad) {
        postsList.innerHTML = ''; // Очищаем только при первой загрузке
    }

    if (posts.length === 0 && isFirstLoad) {
        postsList.innerHTML = "<p>У вас пока нет постов</p>";
        return;
    }

    const postsHTML = posts.map(post => `
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

    if (isFirstLoad) {
        postsList.innerHTML = postsHTML;
    } else {
        postsList.innerHTML += postsHTML;
    }
}

function setupInfiniteScroll() {
    window.addEventListener('scroll', () => {
        if (isLoading || !hasMore) return;

        const scrollTop = document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight;
        const clientHeight = document.documentElement.clientHeight;

        if (scrollTop + clientHeight >= scrollHeight - 100) {
            loadPosts(currentCursor);
        }
    });
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
            // Перезагружаем с начала
            currentCursor = null;
            hasMore = true;
            await loadPosts();

        } else {
            showMessage("Ошибка удаления", "red");
        }
    } catch (error) {
        console.error("Error deleting post:", error);
        showMessage("Ошибка сети", "red");
    }
}
