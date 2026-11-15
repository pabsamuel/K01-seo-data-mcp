// Paddle's overlay lets the buyer raise the quantity; one purchase is one plan, so checkout.js puts it back to 1.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

test('site/checkout.js puts a raised quantity back to 1 and says why', async () => {
  const updated = [];
  let cb = null;
  const el = () => ({ hidden: true, textContent: '', dataset: {}, value: '' });
  const status = el();
  const button = { ...el(), dataset: { plan: 'starter' } };
  const nodes = { '#checkout-status': status, '.notice': el(), '#retrieve': el(), '#license': el() };
  const Paddle = {
    Initialize: (o) => { cb = o.eventCallback; },
    Checkout: { open: () => {}, updateItems: (items) => updated.push(items) },
  };
  const ctx = {
    fetch: async () => ({ json: async () => ({ mode: 'open', clientToken: 'live_abc', starterPrice: 'pri_s', proPrice: 'pri_p' }) }),
    document: {
      querySelector: (s) => nodes[s],
      querySelectorAll: () => [button],
      createElement: () => ({}),
      head: { append: (s) => queueMicrotask(() => s.onload()) },
    },
    localStorage: { getItem: () => 'a'.repeat(64), setItem: () => {} },
    crypto: globalThis.crypto,
    Paddle,
    queueMicrotask,
  };
  runInNewContext(readFileSync(new URL('../site/checkout.js', import.meta.url), 'utf8'), ctx);
  for (let i = 0; i < 10; i++) await new Promise((r) => setTimeout(r, 0));
  await button.onclick();
  assert.equal(typeof cb, 'function');
  cb({ name: 'checkout.items.updated', data: { items: [{ price_id: 'pri_s', quantity: 291252 }] } });
  assert.deepEqual(JSON.parse(JSON.stringify(updated)), [[{ priceId: 'pri_s', quantity: 1 }]]);
  assert.match(status.textContent, /One plan per purchase, so the quantity stays at 1/);
  cb({ name: 'checkout.items.updated', data: { items: [{ price_id: 'pri_s', quantity: 1 }] } });
  assert.equal(updated.length, 1);
});
