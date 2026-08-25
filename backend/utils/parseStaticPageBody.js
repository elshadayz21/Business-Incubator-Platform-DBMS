// Splits body text into sections on lines starting with "## Heading"
// Returns { sections: [{ id, title, content }] }
export function parseStaticPageBody(body) {
  if (!body) return [];

  const lines = body.split("\n");
  const sections = [];
  let current = null;

  const slugify = (text) =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");

  for (const line of lines) {
    const match = line.match(/^##\s+(.+)/);
    if (match) {
      if (current) sections.push(current);
      const title = match[1].trim();
      current = { id: slugify(title), title, content: "" };
    } else if (current) {
      current.content += line + "\n";
    } else {
      // Content before the first "## " header — put it in an intro section
      if (!sections.length && !current) {
        current = { id: "intro", title: null, content: "" };
      }
      current.content += line + "\n";
    }
  }
  if (current) sections.push(current);

  return sections.map((s) => ({ ...s, content: s.content.trim() }));
}