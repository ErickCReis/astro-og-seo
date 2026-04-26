import "solid-js";

declare module "solid-js" {
  namespace JSX {
    interface IntrinsicElements {
      "astro-dev-toolbar-window": JSX.HTMLAttributes<HTMLElement>;
    }
  }
}
