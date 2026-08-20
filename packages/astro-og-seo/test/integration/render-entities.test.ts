import { describe, expect, test, vi } from "vite-plus/test";
import { renderOgImage } from "../../src/runtime";
import { createResolvedConfig } from "../helpers/config";

// Astro escapes text nodes when it renders the image slot, so titles reach the
// renderer as entities. Exercise the real renderer instead of the stub mock.
vi.unmock("takumi-js");

const config = createResolvedConfig({
  image: {
    width: 600,
    height: 315,
    stylesheet:
      ".card{display:flex;font-family:Arial;font-size:40px;color:#0f172a;background:#fff}",
  },
});

function renderCard(text: string) {
  return renderOgImage(`<div class="card">${text}</div>`, config).then((image) =>
    Buffer.from(image),
  );
}

describe("renderOgImage entity decoding", () => {
  test.each([
    ["&#39;", "'"],
    ["&#x27;", "'"],
    ["&amp;", "&"],
    ["&quot;", '"'],
    ["&lt;", "<"],
    ["&gt;", ">"],
    ["&eacute;", "é"],
  ])("renders %s as %s", async (entity, character) => {
    const [encoded, literal] = await Promise.all([
      renderCard(`Astro${entity}s`),
      renderCard(`Astro${character}s`),
    ]);

    expect(encoded.equals(literal)).toBe(true);
  });

  test("keeps a bare ampersand that is not an entity", async () => {
    const [bare, escaped] = await Promise.all([
      renderCard("Bun & Astro"),
      renderCard("Bun &amp; Astro"),
    ]);

    expect(bare.equals(escaped)).toBe(true);
  });
});
