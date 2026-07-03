const escapeKey = (prefix, index) => `${prefix}-${index}`;

const renderInline = (text) => {
  const parts = String(text || "").split(/(`[^`]+`|\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={escapeKey("code", index)} className="rounded bg-slate-100 px-1 py-0.5 text-xs font-semibold text-primary">
          {part.slice(1, -1)}
        </code>
      );
    }

    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={escapeKey("strong", index)} className="font-extrabold">
          {part.slice(2, -2)}
        </strong>
      );
    }

    return <span key={escapeKey("text", index)}>{part}</span>;
  });
};

const isTableSeparator = (line) => /^\s*\|?[\s:-]+\|[\s|:-]+\|?\s*$/.test(line);

const parseTableRow = (line) =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());

export default function MarkdownRenderer({ content }) {
  const lines = String(content || "").split("\n");
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (line.startsWith("```")) {
      const language = line.replace("```", "").trim();
      const code = [];
      index += 1;

      while (index < lines.length && !lines[index].startsWith("```")) {
        code.push(lines[index]);
        index += 1;
      }

      blocks.push({ type: "code", language, value: code.join("\n") });
      index += 1;
      continue;
    }

    if (line.includes("|") && lines[index + 1] && isTableSeparator(lines[index + 1])) {
      const header = parseTableRow(line);
      const rows = [];
      index += 2;

      while (index < lines.length && lines[index].includes("|")) {
        rows.push(parseTableRow(lines[index]));
        index += 1;
      }

      blocks.push({ type: "table", header, rows });
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items = [];

      while (index < lines.length && /^\s*[-*]\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*[-*]\s+/, ""));
        index += 1;
      }

      blocks.push({ type: "list", ordered: false, items });
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items = [];

      while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*\d+\.\s+/, ""));
        index += 1;
      }

      blocks.push({ type: "list", ordered: true, items });
      continue;
    }

    if (!line.trim()) {
      index += 1;
      continue;
    }

    blocks.push({ type: "paragraph", value: line });
    index += 1;
  }

  return (
    <div className="space-y-3 text-sm leading-6 text-slate-700">
      {blocks.map((block, blockIndex) => {
        if (block.type === "code") {
          return (
            <div key={escapeKey("block", blockIndex)} className="overflow-hidden rounded-md border border-slate-200 bg-slate-950">
              {block.language && (
                <div className="border-b border-white/10 px-3 py-1 text-xs font-semibold uppercase text-slate-300">
                  {block.language}
                </div>
              )}
              <pre className="overflow-x-auto p-3 text-xs leading-5 text-slate-100">
                <code>{block.value}</code>
              </pre>
            </div>
          );
        }

        if (block.type === "table") {
          return (
            <div key={escapeKey("block", blockIndex)} className="overflow-x-auto rounded-md border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-soft text-slate-600">
                  <tr>
                    {block.header.map((cell, cellIndex) => (
                      <th key={escapeKey("head", cellIndex)} className="px-3 py-2 font-extrabold">
                        {renderInline(cell)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {block.rows.map((row, rowIndex) => (
                    <tr key={escapeKey("row", rowIndex)}>
                      {row.map((cell, cellIndex) => (
                        <td key={escapeKey("cell", cellIndex)} className="px-3 py-2 align-top">
                          {renderInline(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        if (block.type === "list") {
          const ListTag = block.ordered ? "ol" : "ul";
          return (
            <ListTag
              key={escapeKey("block", blockIndex)}
              className={`space-y-1 pl-5 ${block.ordered ? "list-decimal" : "list-disc"}`}
            >
              {block.items.map((item, itemIndex) => (
                <li key={escapeKey("item", itemIndex)}>{renderInline(item)}</li>
              ))}
            </ListTag>
          );
        }

        return <p key={escapeKey("block", blockIndex)}>{renderInline(block.value)}</p>;
      })}
    </div>
  );
}
