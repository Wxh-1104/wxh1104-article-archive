const fs = require("fs-extra");
const path = require("path");
const marked = require("marked");
const fm = require("front-matter"); // Corrected variable name from frontMatter to fm
const dayjs = require("dayjs");
const glob = require("glob");

const outputDir = "public";
const articlesDir = "articles";
const staticDir = "static"; // Optional: if you have other static assets like images

// 确保输出目录存在
fs.ensureDirSync(outputDir);
fs.ensureDirSync(path.join(outputDir, articlesDir));

// 可选：复制其他静态资源 (如 images, css) 到 public 目录
// if (fs.existsSync(staticDir)) {
//     fs.copySync(staticDir, path.join(outputDir, staticDir));
// }

// 复制主 index.html 到 public 目录作为基础
fs.copyFileSync("index.html", path.join(outputDir, "index.html"));

// 获取所有文章
const articleFiles = glob.sync(`${articlesDir}/*.md`);
const articles = articleFiles
  .map((file) => {
    const content = fs.readFileSync(file, "utf8");
    const { attributes, body } = fm(content); // Use fm here
    const htmlContent = marked.parse(body);
    const filename = path.basename(file, ".md");

    return {
      title: attributes.title || "无标题文章",
      date: attributes.date
        ? dayjs(attributes.date).format("YYYY/MM/DD")
        : dayjs().format("YYYY/MM/DD"),
      summary: attributes.summary || "",
      content: htmlContent,
      filename,
      url: `/${articlesDir}/${filename}.html`, // Ensure leading slash for root-relative URL
    };
  })
  .sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf()); // 按日期降序排序

// 为每篇文章生成 HTML
articles.forEach((article) => {
  const articleHtmlTemplate = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>${article.title}</title>
    <style>
        /* 复制自你的 index.html 样式 - 你可以考虑提取到共享CSS文件 */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: monospace; line-height: 2; padding: 1rem; background: #f5f5f5; font-size: 1.1rem; display: block;}
        .main-title { font-size: 2rem; text-align: center; color: #2c3e50; margin: 1rem 0; padding: 0 1rem; text-decoration: none; display: block; }
        .main-title:hover { text-decoration: underline; } /* Added hover effect for link */
        .divider { height: 3px; background: linear-gradient(90deg, #e7e7e7, #999, #e7e7e7); margin: 1rem auto; width: 90%; max-width: 1000px; }
        .article-content-container { width: 85%; margin: 2rem auto; background: white; padding: 2rem; border-radius: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .article-content-container img { max-width: 100%; height: auto; border-radius: 8px; }
        /* Add other specific styles for article page if needed */
    </style>
</head>
<body>
    <a href="/" class="main-title">${article.title}</a>
    <div class="divider"></div>
    <div class="article-content-container">
        ${article.content}
    </div>
</body>
</html>
  `;
  fs.writeFileSync(
    path.join(outputDir, articlesDir, `${article.filename}.html`),
    articleHtmlTemplate
  );
});

// 更新主页 (public/index.html)
let indexHtmlContent = fs.readFileSync(
  path.join(outputDir, "index.html"),
  "utf8"
);
const articleCardsHtml = articles
  .map(
    (article) => `
  <div class="article-card">
      <h2 class="article-title">${article.title}</h2>
      <div class="article-summary">
          ${article.summary}
      </div>
      <a href="${article.url}" class="read-more">
          <span class="button-text">> 阅读全文</span>
          <span class="publish-date">${article.date}</span>
      </a>
  </div>
`
  )
  .join("\n");

const cardContainerRegex = /<div class="card-container">[\s\S]*?<\/div>/;
if (articles.length > 0) {
  indexHtmlContent = indexHtmlContent.replace(
    cardContainerRegex,
    `<div class="card-container">\n${articleCardsHtml}\n</div>`
  );
} else {
  // 如果没有文章，可以显示提示信息或保留原始的示例卡片
  indexHtmlContent = indexHtmlContent.replace(
    cardContainerRegex,
    `<div class="card-container"><p>暂无文章。</p></div>`
  );
}

fs.writeFileSync(path.join(outputDir, "index.html"), indexHtmlContent);

console.log("网站构建完成！");
