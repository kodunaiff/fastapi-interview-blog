// /static/js/posts.js

function getAuthHeaders() {
  try {
    const token = typeof getToken === 'function' ? getToken() : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

async function loadPost(postId) {
  const container = document.getElementById("postId");
  if (!container) return;

  try {
    container.innerHTML = "<p>Загрузка…</p>";

    const response = await fetch(`/api/v1/posts/${encodeURIComponent(postId)}`, {
      headers: {
        "Accept": "application/json",
        ...getAuthHeaders(),
      },
      cache: "no-cache",
    });

    if (response.status === 401) {
      if (typeof logout === "function") logout();
      return;
    }

    if (response.status === 404) {
      container.innerHTML = "<p>Пост не найден</p>";
      return;
    }

    if (!response.ok) {
      console.error("Error loading post:", response.status);
      container.innerHTML = "<p>Не удалось загрузить пост</p>";
      return;
    }

    const post = await response.json();
    displayPost(post);
  } catch (error) {
    console.error("Error loading post:", error);
    const container = document.getElementById("postId");
    if (container) container.innerHTML = "<p>Ошибка при загрузке поста</p>";
  }
}

// Рендер одного поста
function displayPost(post) {
  const container = document.getElementById("postId");
  if (!container) return;

  const tagsHtml =
    Array.isArray(post.tags) && post.tags.length
      ? `<div class="tags">Теги: ${post.tags
          .map((t) => `<span class="tag">${escapeHtml(t.name)}</span>`)
          .join(" ")}</div>`
      : "";

  container.innerHTML = `
    <article class="post-detail">
      <h3>${escapeHtml(post.title)}</h3>
      <div class="content">${escapeHtml(post.content).replace(/\n/g, "<br>")}</div>

      <div class="meta">
        <small>
          ${post.created_at ? "Создан: " + new Date(post.created_at).toLocaleString("ru-RU") : ""}
        </small>
        ${tagsHtml}
      </div>

      <div class="actions" style="margin-top: 12px;">
        <button type="button" onclick="window.editPost ? editPost('${post.id}') : null">Редактировать</button>
        <button type="button" onclick="window.deletePost ? deletePost('${post.id}') : null">Удалить</button>
      </div>
    </article>
  `;
}

// Простая защита от XSS при вставке текста
function escapeHtml(str) {
  if (typeof str !== "string") return "";
  return str.replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[ch]));
}

// Автозагрузка, если на странице есть контейнер #postId
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("postId");
  if (!container) return;

  const params = new URLSearchParams(location.search);
  const id = params.get("id") || params.get("post_id") || params.get("postId");

  if (!id) {
    container.innerHTML = "<p>Не передан id поста (?id=...)</p>";
    return;
  }

  loadPost(id);
});