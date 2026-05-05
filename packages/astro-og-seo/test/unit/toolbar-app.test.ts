// @vitest-environment happy-dom

import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import {
  getOgTemplate,
  readSeoFields,
  renderPreview,
  previewEndpoint,
} from "../../src/toolbar-app";

afterEach(() => {
  document.head.innerHTML = "";
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("toolbar app helpers", () => {
  test("reads SEO fields from the current document", () => {
    document.head.innerHTML = `
      <meta name="description" content="Description">
      <link rel="canonical" href="https://example.test/">
      <meta property="og:title" content="OG title">
      <meta property="og:description" content="OG description">
      <meta property="og:url" content="https://example.test/">
      <meta property="og:image" content="https://example.test/_og/index.png">
      <meta name="twitter:card" content="summary_large_image">
      <meta name="twitter:image" content="https://example.test/_og/index.png">
      <meta property="article:published_time" content="2026-01-01T00:00:00.000Z">
      <meta property="article:modified_time" content="2026-01-02T00:00:00.000Z">
    `;
    document.title = "Page title";

    expect(readSeoFields()).toEqual(
      expect.arrayContaining([
        { label: "Title", value: "Page title", required: true },
        { label: "Description", value: "Description", required: true },
        { label: "OG image", value: "https://example.test/_og/index.png" },
      ]),
    );
  });

  test("finds the OG image template", () => {
    document.head.innerHTML = `<template data-astro-og-seo-image><div>Image</div></template>`;

    expect(getOgTemplate()?.innerHTML).toContain("<div>Image</div>");
  });

  test("returns null when no OG image template exists", () => {
    document.head.innerHTML = '<meta name="description" content="No template">';

    expect(getOgTemplate()).toBeNull();
  });

  test("renders a preview through the preview endpoint", async () => {
    const template = document.createElement("template");
    template.innerHTML = "<div>Image</div>";
    template.dataset.stylesheet = Buffer.from(".og { color: red; }").toString("base64");
    const setPreview = vi.fn();
    const blob = new Blob(["image"], { type: "image/png" });

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(blob, { status: 200 })),
    );
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:test"),
      revokeObjectURL: vi.fn(),
    });

    await renderPreview(template, setPreview);

    expect(fetch).toHaveBeenCalledWith(
      previewEndpoint,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          html: "<div>Image</div>",
          stylesheet: template.dataset.stylesheet,
        }),
      }),
    );
    expect(setPreview).toHaveBeenLastCalledWith({
      status: "ready",
      message: "",
      src: "blob:test",
    });
  });

  test("captures preview errors", async () => {
    const template = document.createElement("template");
    const setPreview = vi.fn();

    template.innerHTML = "<div>Image</div>";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("Render failed", { status: 500 })),
    );

    await renderPreview(template, setPreview);

    expect(setPreview).toHaveBeenLastCalledWith({
      status: "error",
      message: "Render failed",
      src: null,
    });
  });
});
