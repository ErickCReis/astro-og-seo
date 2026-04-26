import { defineToolbarApp } from "astro/toolbar";
import { For, Show, createSignal, onCleanup, onMount, type Component } from "solid-js";
import { render } from "solid-js/web";

// @ts-ignore
import toolbarStyles from "./toolbar-app.css?inline";

type SeoField = {
  label: string;
  value: string | null;
  required?: boolean;
};

type PreviewState =
  | { status: "idle"; message: string; src: null }
  | { status: "loading"; message: string; src: null }
  | { status: "ready"; message: string; src: string }
  | { status: "error"; message: string; src: null };

const previewEndpoint = "/__astro-og-seo/preview";

function readMeta(selector: string) {
  return document.head.querySelector<HTMLMetaElement>(selector)?.content ?? null;
}

function readLink(selector: string) {
  return document.head.querySelector<HTMLLinkElement>(selector)?.href ?? null;
}

function readSeoFields(): SeoField[] {
  return [
    { label: "Title", value: document.title, required: true },
    {
      label: "Description",
      value: readMeta('meta[name="description"]'),
      required: true,
    },
    { label: "Canonical", value: readLink('link[rel="canonical"]'), required: true },
    { label: "OG title", value: readMeta('meta[property="og:title"]'), required: true },
    {
      label: "OG description",
      value: readMeta('meta[property="og:description"]'),
      required: true,
    },
    { label: "OG URL", value: readMeta('meta[property="og:url"]'), required: true },
    { label: "OG image", value: readMeta('meta[property="og:image"]') },
    { label: "Twitter card", value: readMeta('meta[name="twitter:card"]') },
    { label: "Twitter image", value: readMeta('meta[name="twitter:image"]') },
    {
      label: "Published",
      value: readMeta('meta[property="article:published_time"]'),
    },
    {
      label: "Modified",
      value: readMeta('meta[property="article:modified_time"]'),
    },
  ];
}

function getOgTemplate() {
  return document.head.querySelector<HTMLTemplateElement>("template[data-astro-og-seo-image]");
}

async function renderPreview(
  template: HTMLTemplateElement,
  setPreview: (state: PreviewState) => void,
) {
  setPreview({ status: "loading", message: "Rendering preview...", src: null });

  try {
    const response = await fetch(previewEndpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        html: template.innerHTML,
        stylesheet: template.dataset.stylesheet ?? "",
      }),
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const blob = await response.blob();
    const src = URL.createObjectURL(blob);

    setPreview({
      status: "ready",
      message: "",
      src,
    });
  } catch (error) {
    setPreview({
      status: "error",
      message: error instanceof Error ? error.message : "Unable to render preview.",
      src: null,
    });
  }
}

const FieldRow: Component<{ field: SeoField }> = (props) => {
  const hasValue = () => Boolean(props.field.value?.trim());
  const status = () => (hasValue() ? "set" : props.field.required ? "missing" : "empty");

  return (
    <tr class="border-t border-slate-800/80 first:border-t-0">
      <th class="w-32 py-3 pr-3 text-left align-top text-[13px] font-semibold text-slate-100">
        {props.field.label}
      </th>
      <td
        classList={{
          "text-slate-500": !hasValue(),
          "text-slate-300": hasValue(),
        }}
        class="py-3 pr-3 align-top font-mono text-xs leading-5 overflow-wrap-anywhere"
      >
        {props.field.value?.trim() || "Not present on this page"}
      </td>
      <td
        classList={{
          "text-amber-100": props.field.required && !hasValue(),
          "text-slate-400": !props.field.required || hasValue(),
        }}
        class="w-20 py-3 text-right align-top font-mono text-[11px] uppercase leading-5"
      >
        {status()}
      </td>
    </tr>
  );
};

const ToolbarPanel: Component = () => {
  const fields = readSeoFields();
  const template = getOgTemplate();
  const [preview, setPreview] = createSignal<PreviewState>(
    template
      ? { status: "idle", message: "Preparing image preview...", src: null }
      : { status: "idle", message: "No inline og-image slot on this page.", src: null },
  );

  onMount(() => {
    if (template) {
      void renderPreview(template, setPreview);
    }
  });

  onCleanup(() => {
    const src = preview().src;

    if (src) {
      URL.revokeObjectURL(src);
    }
  });

  return (
    <>
      <astro-dev-toolbar-window>
        <style>{toolbarStyles}</style>
        <section class="box-border w-full h-full overflow-scroll rounded-xl border border-slate-700/70 bg-slate-950 text-slate-100 shadow-2xl shadow-black/50">
          <header class="border-b border-slate-800 bg-slate-950 px-4 py-4">
            <div class="mb-2 font-mono text-[11px] font-bold uppercase leading-none tracking-[0.14em] text-cyan-300">
              Astro OG SEO
            </div>
            <h2 class="m-0 wrap-break-word text-lg font-semibold leading-tight text-white">
              {window.location.pathname}
            </h2>
          </header>

          <Show when={template}>
            <section class="border-b border-slate-800 px-4 py-4">
              <Show when={preview().src}>
                {(src) => (
                  <img
                    alt="Open Graph image preview"
                    class="mb-3 aspect-1200/630 w-full rounded-lg bg-black object-cover"
                    src={src()}
                  />
                )}
              </Show>
              <p
                classList={{
                  "text-amber-100": preview().status === "error",
                  "text-slate-400": preview().status !== "error",
                }}
                class="m-0 text-sm leading-5"
              >
                {preview().message}
              </p>
            </section>
          </Show>

          <section class="px-4 py-2">
            <table class="w-full table-fixed border-collapse">
              <thead>
                <tr class="font-mono text-[11px] uppercase leading-none text-slate-500">
                  <th class="w-32 py-2 pr-3 text-left font-semibold">Field</th>
                  <th class="py-2 pr-3 text-left font-semibold">Value</th>
                  <th class="w-20 py-2 text-right font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                <For each={fields}>{(field) => <FieldRow field={field} />}</For>
              </tbody>
            </table>
          </section>
        </section>
      </astro-dev-toolbar-window>
    </>
  );
};

let disposeToolbar: (() => void) | undefined;

function renderPanel(canvas: ShadowRoot) {
  disposeToolbar?.();
  canvas.textContent = "";
  disposeToolbar = render(() => <ToolbarPanel />, canvas);
}

export default defineToolbarApp({
  init(canvas, app) {
    renderPanel(canvas);

    app.onToggled(({ state }) => {
      if (state) {
        renderPanel(canvas);
      }
    });

    document.addEventListener("astro:page-load", () => renderPanel(canvas));
  },
});
