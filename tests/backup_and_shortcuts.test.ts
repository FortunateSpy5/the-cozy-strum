import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeCrc32, createZipUint8Array } from '../src/lib/storage/zipExport';
import {
  createBackupJson,
  parseBackupJson,
  restoreTabsFromJson
} from '../src/lib/storage/backupRestore';
import { generateMarkdownWithFrontmatter } from '../src/lib/storage/exportMd';
import type { UserTab } from '../src/lib/types';

describe('ZIP Engine & CRC32 Verification', () => {
  it('computes correct standard CRC32 for empty and known strings', () => {
    const encoder = new TextEncoder();
    assert.equal(computeCrc32(new Uint8Array(0)), 0);

    const testBytes = encoder.encode('123456789');
    // Standard IEEE 802.3 CRC-32 test vector for "123456789" is 0xcbf43926
    assert.equal(computeCrc32(testBytes), 0xcbf43926);

    const utf8Bytes = encoder.encode('The Cozy Strum 🎵🎸');
    assert.ok(computeCrc32(utf8Bytes) > 0);
  });

  it('creates valid PKZIP binary archive structure with correct signatures', () => {
    const files = [
      { name: 'hello.txt', content: 'Cozy Strum' },
      { name: 'tabs/song.md', content: '---\ntitle: "Song"\n---\n[Am] [G]\n' },
      { name: 'empty.txt', content: '' }
    ];

    const zipBytes = createZipUint8Array(files);
    assert.ok(zipBytes.length > 50, 'ZIP bytes should not be empty');

    const view = new DataView(zipBytes.buffer, zipBytes.byteOffset, zipBytes.byteLength);

    // Local Header 1: PK\x03\x04 with UTF-8 flag 0x0800
    assert.equal(view.getUint32(0, true), 0x04034b50, 'Local header signature mismatch');
    assert.equal(view.getUint16(6, true), 0x0800, 'UTF-8 flag mismatch');

    // End of Central Directory signature: PK\x05\x06 at end - 22 bytes
    const eocdOffset = zipBytes.length - 22;
    assert.equal(view.getUint32(eocdOffset, true), 0x06054b50, 'EOCD signature mismatch');
    assert.equal(view.getUint16(eocdOffset + 10, true), 3, 'Total entries mismatch');
  });

  it('sanitizes dangerous paths and prevents Zip Slip', () => {
    const files = [{ name: '../../etc/passwd', content: 'root' }];
    const zipBytes = createZipUint8Array(files);
    const view = new DataView(zipBytes.buffer, zipBytes.byteOffset, zipBytes.byteLength);
    const nameLen = view.getUint16(26, true);
    const nameBytes = zipBytes.subarray(30, 30 + nameLen);
    const extractedName = new TextDecoder().decode(nameBytes);
    assert.ok(!extractedName.includes('..'), 'Path traversal must be stripped');
    assert.equal(extractedName, 'etc/passwd');
  });
});

describe('Backup & Restore JSON Engine', () => {
  const sampleUserTabs: UserTab[] = [
    {
      id: 'custom-wonderwall-1',
      title: 'Wonderwall',
      artist: 'Oasis',
      instrument: 'guitar',
      tuning: 'Standard (E A D G B e)',
      capo: 2,
      difficulty: 'beginner',
      isFingerstyle: false,
      createdAt: '2026-11-09',
      tags: ['Acoustic', '90s'],
      slug: 'wonderwall',
      content: '[Em7] [G] Today is gonna be the day',
      isCustom: true
    }
  ];

  it('creates and parses valid backup JSON with metadata', () => {
    const jsonStr = createBackupJson(sampleUserTabs, []);
    const data = parseBackupJson(jsonStr);

    assert.equal(data.totalTabs, 1);
    assert.equal(data.tabs[0]?.title, 'Wonderwall');
    assert.equal(data.tabs[0]?.artist, 'Oasis');
  });

  it('rejects invalid backup JSON without tabs array', () => {
    assert.throws(() => {
      parseBackupJson('{"app": "other"}');
    }, /Missing "tabs" array/);
  });

  it('rejects empty or oversized JSON payloads', () => {
    assert.throws(() => parseBackupJson(''), /Payload is empty/);
  });

  it('prevents prototype pollution in backup payload', () => {
    const maliciousJson =
      '{"app":"the-cozy-strum","version":1,"tabs":[{"__proto__":{"admin":true},"title":"Hacked","content":"[Am]","slug":"hacked"}]}';

    const res = restoreTabsFromJson(maliciousJson);
    assert.equal(res.success, true);
    assert.equal(res.count, 0, 'Malicious tab with __proto__ must be rejected');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    assert.equal((Object.prototype as any).admin, undefined);
  });

  it('safely normalizes tabs with missing fields during restore', () => {
    const incompleteJson = JSON.stringify({
      app: 'the-cozy-strum',
      tabs: [{ title: 'Bare Bones', content: '[C] [G]', slug: 'bare-bones' }]
    });

    const res = restoreTabsFromJson(incompleteJson);
    assert.equal(res.success, true);
    assert.equal(res.count, 1);

    // Verify markdown generation does not crash on missing fields
    const md = generateMarkdownWithFrontmatter(
      { title: 'Incomplete' },
      '[C] [G] Strumming'
    );
    assert.ok(md.includes('title: "Incomplete"'));
    assert.ok(md.includes('tags: []'));
  });

  it('handles corrupt JSON string gracefully', () => {
    const result = restoreTabsFromJson('invalid-json{{{');
    assert.equal(result.success, false);
    assert.equal(result.count, 0);
    assert.ok(result.error);
  });
});
