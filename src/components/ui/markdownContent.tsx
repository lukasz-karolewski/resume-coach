import Markdown from "markdown-to-jsx";

export function MarkdownContent({ children }: { children: string }) {
  return (
    <Markdown
      options={{
        overrides: {
          a: {
            component: "a",
            props: { className: "text-blue-600 hover:underline" },
          },
          blockquote: {
            component: "blockquote",
            props: { className: "border-l-4 border-gray-300 pl-4 italic mb-4" },
          },
          code: {
            component: "code",
            props: {
              className: "bg-gray-100 rounded px-1 py-0.5 font-mono text-sm",
            },
          },
          h1: {
            component: "h1",
            props: { className: "font-bold mb-3" },
          },
          h2: {
            component: "h2",
            props: { className: "font-semibold mb-2" },
          },
          h3: {
            component: "h3",
            props: { className: "font-semibold mb-1" },
          },
          li: { component: "li", props: { className: "mb-1" } },
          ol: {
            component: "ol",
            props: { className: "list-decimal list-inside mb-4" },
          },
          p: { component: "p", props: { className: "" } },
          pre: {
            component: "pre",
            props: {
              className: "bg-gray-100 rounded p-4 mb-4 overflow-x-auto",
            },
          },
          ul: {
            component: "ul",
            props: { className: "list-disc list-inside mb-4" },
          },
        },
      }}
    >
      {children}
    </Markdown>
  );
}
