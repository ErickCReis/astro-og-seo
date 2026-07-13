import { defineToolbarApp } from "astro/toolbar";
import { For, Show, createMemo, createSignal, onCleanup, onMount, type Component } from "solid-js";
import { render } from "solid-js/web";
import { auditSeoSnapshot, type SeoSeverity } from "./audit";
import { decodeTemplate, getOgTemplate, readSeoSnapshot } from "./document";
// @ts-ignore generated as an inline string by the package build
import styles from "./app.css?inline";

const endpoint = "/__astro-og-seo/preview";
const severityOrder: SeoSeverity[] = ["error", "warning", "info", "pass"];

const Panel: Component = () => {
  const snapshot = readSeoSnapshot();
  const diagnostics = auditSeoSnapshot(snapshot);
  const template = getOgTemplate();
  const imagePayload = template ? decodeTemplate(template) : null;
  const [preview, setPreview] = createSignal<{ src?: string; error?: string; loading?: boolean }>({
    loading: Boolean(imagePayload),
  });
  const counts = createMemo(() =>
    Object.fromEntries(
      severityOrder.map((severity) => [
        severity,
        diagnostics.filter((item) => item.severity === severity).length,
      ]),
    ),
  );
  let active = true;

  onMount(async () => {
    if (!imagePayload) return;
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(imagePayload),
      });
      if (!response.ok) throw new Error(await response.text());
      const src = URL.createObjectURL(await response.blob());
      if (!active) return URL.revokeObjectURL(src);
      setPreview({ src });
    } catch (error) {
      if (active)
        setPreview({ error: error instanceof Error ? error.message : "Unable to render preview." });
    }
  });
  onCleanup(() => {
    active = false;
    const src = preview().src;
    if (src) URL.revokeObjectURL(src);
  });

  return (
    <astro-dev-toolbar-window>
      <style>{styles}</style>
      <main class="inspector">
        <header class="masthead">
          <div>
            <p class="eyebrow">SEO signal</p>
            <h1>{window.location.pathname}</h1>
          </div>
          <div class="rail" aria-label="Diagnostic summary">
            <For each={severityOrder}>
              {(severity) => (
                <span class={`count ${severity}`}>
                  <b>{counts()[severity]}</b>
                  {severity}
                </span>
              )}
            </For>
          </div>
        </header>
        <Show when={imagePayload}>
          <section class="preview-block" aria-label="Open Graph image preview">
            <Show when={preview().src}>
              {(src) => <img src={src()} alt="Generated Open Graph preview" />}
            </Show>
            <Show when={preview().loading}>
              <p>Rendering the page’s social image…</p>
            </Show>
            <Show when={preview().error}>{(error) => <p class="failure">{error()}</p>}</Show>
          </section>
        </Show>
        <section class="diagnostics" aria-label="SEO diagnostics">
          <For each={diagnostics}>
            {(item) => (
              <article class={`diagnostic ${item.severity}`}>
                <span class="signal" aria-hidden="true"></span>
                <div>
                  <strong>{item.label}</strong>
                  <p>{item.message}</p>
                </div>
                <em>{item.severity}</em>
              </article>
            )}
          </For>
        </section>
      </main>
    </astro-dev-toolbar-window>
  );
};

let dispose: (() => void) | undefined;
function draw(canvas: ShadowRoot) {
  dispose?.();
  canvas.textContent = "";
  dispose = render(() => <Panel />, canvas);
}

export default defineToolbarApp({
  init(canvas, app) {
    draw(canvas);
    app.onToggled(({ state }) => {
      if (state) draw(canvas);
    });
    document.addEventListener("astro:page-load", () => draw(canvas));
  },
});
