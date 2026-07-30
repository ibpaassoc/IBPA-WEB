import assert from "node:assert/strict";
import test from "node:test";

import { assertTransactionalEmailDeliveryEnabled } from "./email";

test("transactional email rejects disabled delivery instead of reporting a dry-run success", () => {
  assert.throws(
    () => assertTransactionalEmailDeliveryEnabled(false),
    /Email delivery is disabled/,
  );
  assert.doesNotThrow(() => assertTransactionalEmailDeliveryEnabled(true));
});
