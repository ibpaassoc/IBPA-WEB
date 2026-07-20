import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { PreservedText } from "./PreservedText";

test("plain-text rendering keeps authored new lines and safe text semantics", () => {
  const authored = "First paragraph\n\n- first item\n- second item\nhttps://example.com/a-very-long-path";
  const markup = renderToStaticMarkup(createElement(PreservedText, null, authored));

  assert.match(markup, /whitespace-pre-wrap/);
  assert.match(markup, /overflow-wrap:anywhere/);
  assert.ok(markup.includes("First paragraph\n\n- first item\n- second item\n"));
  assert.doesNotMatch(markup, /dangerouslySetInnerHTML/);
});
