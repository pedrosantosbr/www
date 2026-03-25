/**
 * Shiki transformer that converts mermaid code blocks into
 * raw <div class="mermaid"> elements for client-side rendering.
 *
 * Must be registered as the first transformer so it intercepts
 * mermaid blocks before other transformers try to process them.
 */
export const transformerMermaid = () => {
  let mermaidSource = "";

  return {
    name: "mermaid",

    preprocess(code, options) {
      if (options.lang === "mermaid") {
        mermaidSource = code;
      }
      return code;
    },

    pre(node) {
      if (this.options.lang !== "mermaid") return;

      // Replace <pre> with <div class="mermaid">
      node.tagName = "div";
      node.properties = { class: "mermaid" };
      node.children = [{ type: "text", value: mermaidSource }];
    },
  };
};
