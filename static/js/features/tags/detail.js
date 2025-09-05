// static/js/features/tags/detail.js


document.addEventListener("DOMContentLoaded", async () => {
    await loadTagDetail();
});

async function loadTagDetail() {
    const tagId = getTagIdFromUrl();
    if (!tagId) {
        showMessage("Тэг не найден", "red");
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
            displayTagDetail(tag);
        } else {
            showMessage("Тэг не найден", "red");
        }

    } catch (error) {
        console.error("Error loading tag:", error);
        showMessage("Ошибка загрузки", "red");
    }
}

function getTagIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

function displayTagDetail(tag) {
    const tagDetail = document.getElementById("tag-detail");

    tagDetail.innerHTML = `
        <div style="border: 1px solid #ccc; padding: 20px; border-radius: 5px; max-width: 800px; margin: 0 auto;">
            <h2 style="margin: 0 0 20px 0;">${tag.name}</h2>

            ${tag.posts && tag.posts.length > 0 ? `
                <h3>Посты с тегом (${tag.posts.length}):</h3>
                <div style="margin-top: 15px;">
                    ${tag.posts.map(post => `
                        <div style="border: 1px solid #eee; padding: 10px; margin: 10px 0; border-radius: 5px;">
                            <h4 style="margin: 0 0 5px 0;">${post.title}</h4>
                            <small>Создан: ${new Date(post.created_at).toLocaleDateString()}</small>
                            <br>
                            <button onclick="openPostDetail('${post.id}')">Открыть пост</button>
                        </div>
                    `).join('')}
                </div>
            ` : '<p>Нет постов с этим тегом</p>'}


            <small>Создан: ${new Date(tag.created_at).toLocaleDateString()}</small>

            <br>
            <button onclick="editTag('${tag.id}')">Редактировать</button>
            <button onclick="deleteTag('${tag.id}')">Удалить</button>
        </div>
    `;
}

function openPostDetail(postId) {
    window.location.href = `/static/templates/posts/detail.html?id=${postId}`;
}

function editTag(tagId) {
    window.location.href = `/static/templates/tags/edit.html?id=${tagId}`;
}

async function deleteTag(tagId) {
    if (!confirm("Удалить этот tag?")) return;

    try {
        const response = await fetch(`/api/v1/tags/${tagId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${getToken()}`
            }
        });

        if (response.status === 204) {
            showMessage("Tag удален", "green");
            setTimeout(() => window.location.href = '/static/templates/tags/list.html', 1000);
        } else {
            showMessage("Ошибка удаления", "red");
        }
    } catch (error) {
        console.error("Error deleting post:", error);
        showMessage("Ошибка сети", "red");
    }
}

function showMessage(text, color) {
    const messageDiv = document.getElementById("tag-message");
    messageDiv.innerText = text;
    messageDiv.style.color = color;
}
