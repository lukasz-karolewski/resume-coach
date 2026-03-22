declare module "markdown-to-jsx" {
  import type { ComponentType, ReactNode } from "react";

  interface MarkdownOptions {
    [key: string]: unknown;
  }

  interface MarkdownProps {
    children?: ReactNode;
    options?: MarkdownOptions;
  }

  const Markdown: ComponentType<MarkdownProps>;

  export default Markdown;
}