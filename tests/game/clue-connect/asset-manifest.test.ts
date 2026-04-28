/**
 * Batch 1: Asset manifest — bundle schema
 * Tests: scene-clue-connect bundle declared; prefix correct
 */

import { describe, it, expect } from 'vitest';
import { manifest } from '~/game/asset-manifest';

describe('asset manifest — bundle schema', () => {
  it('scene-clue-connect bundle declared in manifest', () => {
    const bundle = manifest.bundles.find((b) => b.name === 'scene-clue-connect');
    expect(bundle).toBeDefined();
  });

  it('bundle prefix matches scene-* pattern', () => {
    const bundle = manifest.bundles.find((b) => b.name === 'scene-clue-connect');
    expect(bundle!.name).toMatch(/^scene-[a-z][a-z0-9-]*$/);
  });
});
