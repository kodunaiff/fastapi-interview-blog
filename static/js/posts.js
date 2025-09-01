// /static/js/posts.js
const API_BASE = "/api/v1";
// Путь к детальной странице — поправь, если у тебя другой
const DETAIL_PAGE = "/static/templates/posts/detail.html";

function getAuthHeaders() {
  try {
    const token = typeof getToken === "function" ? getToken() : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

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

function excerpt(text, len = 200) {
  if (typeof text !== "string") return "";
  const t = text.trim();
  return t.length > len ? t.slice(0, len).trim() + "…" : t;
}

function toDetailHref(id) {
  return `${DETAIL_PAGE}?id=${encodeURIComponent(id)}`;
}

/* ========= Список постов ========= */
async function loadAllPosts() {
  const container = document.getElementById("posts-all-list");
  if (!container) return;

  try {
    container.innerHTML = "<p>Загрузка…</p>";

    const res = await fetch(`${API_BASE}/posts/`, {
      headers: { Accept: "application/json", ...getAuthHeaders() },
      cache: "no-cache",
    });

    if (res.status === 401) {
      if (typeof logout === "function") logout();
      return;
    }

    if (!res.ok) {
      console.error("Error loading posts:", res.status);
      container.innerHTML = "<p>Не удалось загрузить посты</p>";
      return;
    }

    const posts = await res.json();
    renderPostsList(container, posts);
  } catch (e) {
    console.error("Error loading posts:", e);
    container.innerHTML = "<p>Ошибка при загрузке постов</p>";
  }
}

function renderPostsList(container, posts) {
  if (!Array.isArray(posts) || posts.length === 0) {
    container.innerHTML = "<p>Пока нет постов</p>";
    return;
  }

  container.innerHTML = posts
    .map((p) => {
      const title = escapeHtml(p.title || "Без названия");
      const preview = escapeHtml(excerpt(p.content || "", 200));
      const created = p.created_at ? new Date(p.created_at).toLocaleString("ru-RU") : "";
      const owner =
        p.owner && (p.owner.username || p.owner.email)
          ? ` • Автор: ${escapeHtml(p.owner.username || p.owner.email)}`
          : "";
      const tags =
        Array.isArray(p.tags) && p.tags.length
          ? `<div class="tags">${p.tags
              .map((t) => `<span class="tag">${escapeHtml(t.name)}</span>`)
              .join(" ")}</div>`
          : "";

      const href = toDetailHref(p.id);

      return `
        <article class="post-card" data-id="${p.id}" style="border:1px solid #ddd; padding:12px; border-radius:8px; margin:10px 0;">
          <h3 style="margin:0 0 8px;">
            <a href="${href}" class="post-link" style="text-decoration:none;">${title}</a>
          </h3>
          <p style="margin:6px 0 8px;">${preview}</p>
          <div class="meta" style="color:#666; font-size:12px;">${created}${owner}</div>
          ${tags}
          <div style="margin-top:8px;">
            <a href="${href}" class="post-link">Читать →</a>
          </div>
        </article>
      `;
    })
    .join("");

  // Дополнительно: клик по всей карточке ведёт на деталь
  container.addEventListener("click", (e) => {
    const link = e.target.closest("a.post-link");
    if (link) return; // обычная ссылка работает сама

    const card = e.target.closest(".post-card");
    if (!card) return;
    window.location.href = toDetailHref(card.dataset.id);
  }, { once: true });
}

/* ========= Детальная страница ========= */
async function loadPost(postId) {
  const container = document.getElementById("postId");
  if (!container) return;

  try {
    container.innerHTML = "<p>Загрузка…</p>";

    const response = await fetch(`${API_BASE}/posts/${encodeURIComponent(postId)}`, {
      headers: { Accept: "application/json", ...getAuthHeaders() },
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
        <small>${post.created_at ? "Создан: " + new Date(post.created_at).toLocaleString("ru-RU") : ""}</small>
        ${tagsHtml}
      </div>

      <div class="actions" style="margin-top: 12px;">
        <button type="button" onclick="window.editPost ? editPost('${post.id}') : null">Редактировать</button>
        <button type="button" onclick="window.deletePost ? deletePost('${post.id}') : null">Удалить</button>
      </div>
    </article>
  `;
}

/* ========= Автозапуск ========= */
document.addEventListener("DOMContentLoaded", () => {
  const listContainer = document.getElementById("posts-all-list");
  if (listContainer) {
    loadAllPosts();
  }

  const detailContainer = document.getElementById("postId");
  if (detailContainer) {
    const params = new URLSearchParams(location.search);
    const id = params.get("id") || params.get("post_id") || params.get("postId");
    if (!id) {
      detailContainer.innerHTML = "<p>Не передан id поста (?id=...)</p>";
      return;
    }
    loadPost(id);
  }
});