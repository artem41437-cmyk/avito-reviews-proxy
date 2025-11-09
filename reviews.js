// api/reviews.js
// Vercel Serverless Function: вытаскивает отзывы с Авито.
// Берёт ссылку из ENV AVITO_SELLER_URL или из query ?url=...
// ⚠️ Разметка Авито может меняться. Парсер легко поправить: см. TODO ниже.

export default async function handler(req, res) {
  try {
    const { url } = req.query;
    const target = decodeURIComponent(url || process.env.AVITO_SELLER_URL || "");

    if (!target) {
      return res.status(400).json({ ok: false, error: "Missing AVITO_SELLER_URL or ?url=" });
    }

    // Заголовки для CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.status(200).end();

    // Фетчим страницу
    const html = await fetch(target, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0 Safari/537.36",
        "Accept-Language": "ru,en;q=0.9",
      },
      // можно добавить proxy/timeout при желании
    }).then(r => r.text());

    // ========== Грубый парсинг =========
    // 1) Пытаемся найти JSON внутри <script> с ключами "review" / "reviews"
    const scriptMatches = [...html.matchAll(/<script[^>]*>([\\s\\S]*?)<\\/script>/gi)];
    let reviews = [];
    for (const m of scriptMatches) {
      const body = m[1];
      if (!/review/i.test(body)) continue;
      try {
        // Извлекаем JSON-объекты
        const jsonCandidates = body.match(/\\{[\\s\\S]*\\}/g) || [];
        for (const jc of jsonCandidates) {
          if (!/review/i.test(jc)) continue;
          const maybe = JSON.parse(safeJson(jc));
          if (Array.isArray(maybe)) {
            const found = maybe.flatMap(extractReviewsFromJson);
            if (found.length) reviews.push(...found);
          } else if (typeof maybe === "object") {
            const found = extractReviewsFromJson(maybe);
            if (found.length) reviews.push(...found);
          }
        }
      } catch {}
      if (reviews.length) break;
    }

    // 2) Фолбэк: очень простой парсинг текста (например, meta description)
    if (!reviews.length) {
      const fallback = [...html.matchAll(/<meta\\s+name="description"\\s+content="([^"]+)"/i)];
      if (fallback.length) {
        reviews.push({
          author: "Avito",
          date: "",
          rating: null,
          text: fallback[0][1].slice(0, 200) + "…",
          url: target,
        });
      }
    }

    const limit = parseInt(req.query.limit || "6", 10);
    reviews = reviews
      .map(normalizeReview)
      .filter(r => r && r.text && r.text.trim().length > 0)
      .slice(0, limit);

    return res.status(200).json({
      ok: true,
      source: target,
      total: reviews.length,
      reviews,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: e?.message || "Internal error" });
  }
}

function safeJson(str) {
  const first = str.indexOf("{");
  const last = str.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    return str.slice(first, last + 1);
  }
  return str;
}

function extractReviewsFromJson(obj) {
  const out = [];
  if (!obj || typeof obj !== "object") return out;

  if (Array.isArray(obj)) {
    for (const item of obj) out.push(...extractReviewsFromJson(item));
    return out;
  }

  for (const [k, v] of Object.entries(obj)) {
    const key = k.toLowerCase();
    if (key === "review" || key === "reviews") {
      const arr = Array.isArray(v) ? v : [v];
      for (const r of arr) {
        out.push({
          author: r?.author?.name || r?.author || "",
          date: r?.datePublished || r?.date || "",
          rating: r?.reviewRating?.ratingValue || r?.rating || null,
          text: r?.reviewBody || r?.text || "",
          url: r?.url || "",
        });
      }
    } else if (v && typeof v === "object") {
      out.push(...extractReviewsFromJson(v));
    }
  }
  return out;
}

function normalizeReview(r) {
  const clean = (s) =>
    String(s || "")
      .replace(/\\s+/g, " ")
      .replace(/&quot;|&laquo;|&raquo;/g, '"')
      .trim();

  return {
    author: clean(r.author || "Покупатель"),
    date: clean(r.date || ""),
    rating: (r.rating && Number(r.rating)) || null,
    text: clean(r.text),
    url: r.url || "",
  };
}
