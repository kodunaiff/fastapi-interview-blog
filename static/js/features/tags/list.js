// static/js/features/tags/list.js

document.addEventListener("DOMContentLoaded", async () => {
    await loadAllTags();
});


async function loadAllTags() {
    try {
        const response = await fetch("/api/v1/tags/", {
            headers: {
                "Authorization": `Bearer ${getToken()}`
            }
        });

        if (response.status === 401) {
            logout();
            return;
        }

        if (response.ok) {
            const tags = await response.json();
            displayAllTags(tags);
        } else {
            console.error("Error loading posts:", response.status);
        }

    } catch (error) {
        console.error("Error loading tags:", error);
    }
}

// Отображение постов
function displayAllTags(tags) {
    const tagsList = document.getElementById("tags-all");

    if (tags.length === 0) {
        tagsList.innerHTML = "<p>У вас пока нет тэгов</p>";
        return;
    }

    tagsList.innerHTML = tags.map(tag => `
        <div style="border: 1px solid #ccc; padding: 15px; margin: 10px 0; border-radius: 5px; cursor: pointer;"
            onclick="openPostDetail('${tag.id}')">
            <h3 style="margin: 0 0 10px 0;">${tag.name}</h3>

            <small style="color: #666;">Создан: ${new Date(tag.created_at).toLocaleDateString()}</small>
            <button onclick="event.stopPropagation(); openTagDetail('${tag.id}')">Подробнее</button>

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
function openTagDetail(tagId) {
    window.location.href = `/static/templates/tags/detail.html?id=${tagId}`;
}

async function deletePost(postId) {
    if (!confirm("Удалить этот пост?")) return;

    try {
        const response = await fetch(`/api/v1/tags/${tagId}`, {
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
