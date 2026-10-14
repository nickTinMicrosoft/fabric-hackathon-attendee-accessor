import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Liquid } from "liquidjs";
import MarkdownIt from "markdown-it";
import { parse } from "yaml";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const config = parse(await readFile(path.join(root, "_config.yml"), "utf8"));
const base = config.baseurl;
const mime = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".ipynb": "application/json" };
const engine = new Liquid();
engine.registerFilter("relative_url", (value) => `${base}${value}`);
engine.registerFilter("uri_escape", (value) => encodeURI(value));
engine.registerFilter("url_decode", (value) => decodeURIComponent(value));
const markdown = new MarkdownIt({ html: true });
// This preview is for local smoke tests; CI uses real Jekyll output instead.
markdown.renderer.rules.heading_open = (tokens, index, options, env, renderer) => {
  const title = tokens[index + 1].content.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
  tokens[index].attrSet("id", title);
  return renderer.renderToken(tokens, index, options);
};
function frontMatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  return { data: match ? parse(match[1]) : {}, body: match ? text.slice(match[0].length) : text };
}
async function renderPage(relative) {
  const { data, body } = frontMatter(await readFile(path.join(root, relative), "utf8"));
  const site = { ...config, data: {} };
  for (const name of ["journey", "goals"]) site.data[name] = parse(await readFile(path.join(root, "_data", `${name}.yml`), "utf8"));
  const context = { site, page: { ...data, url: `/${relative.replace(/\\/g, "/").replace(/\.md$/, ".html")}` } };
  let content = await engine.parseAndRender(body, context);
  if (relative.endsWith(".md")) {
    content = markdown.render(content).replace(/href="([^"]+)\.md([#"][^"]*)/g, 'href="$1.html$2');
  }
  let layout = data.layout ?? "page";
  while (layout) {
    const template = frontMatter(await readFile(path.join(root, "_layouts", `${layout}.html`), "utf8"));
    content = await engine.parseAndRender(template.body, { ...context, content });
    layout = template.data.layout;
  }
  return content;
}
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    if (!url.pathname.startsWith(`${base}/`)) { res.writeHead(404).end(); return; }
    let relative = decodeURIComponent(url.pathname.slice(base.length + 1)) || "index.html";
    if (relative.endsWith("/")) relative += "index.html";
    const file = path.resolve(root, process.env.SITE_DIR || ".", relative);
    const allowed = path.resolve(root, process.env.SITE_DIR || ".");
    if (!file.startsWith(`${allowed}${path.sep}`)) { res.writeHead(403).end(); return; }
    let content;
    if (!process.env.SITE_DIR && relative.endsWith(".html")) {
      if (relative !== "index.html") relative = relative.replace(/\.html$/, ".md");
      content = await renderPage(relative);
    } else content = await readFile(file);
    res.writeHead(200, { "Content-Type": mime[path.extname(file)] || "application/octet-stream" }).end(content);
  } catch (error) {
    if (error.code === "ENOENT") res.writeHead(404).end("Not found");
    else { console.error(error); res.writeHead(500).end("Preview failed"); }
  }
});
server.listen(4173, "127.0.0.1", () => console.log(`Preview: http://127.0.0.1:4173${base}/`));
