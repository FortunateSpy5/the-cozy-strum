import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeCrc32, createZipUint8Array } from '../src/lib/storage/zipExport';
import {
  createBackupJson,
  parseBackupJson,
  restoreTabsFromJson
} from '../src/lib/storage/backupRestore';
import type { UserTab } from '../src/lib/types';

describe('ZIP Engine & CRC32 Verification', () => {
  it('computes correct standard CRC32 for known strings', () => {
    const encoder = new TextEncoder();
    const emptyBytes = new Uint8Array(0);
    assert.equal(computeCrc32(emptyBytes), 0);

    const testBytes = encoder.encode('123456789');
    // Standard CRC-32 test vector for "123456789" is 0xcbf43926
    assert.equal(computeCrc32(testBytes), 0xcbf43926);
  });

  it('creates valid PKZIP binary archive structure with correct signatures', () => {
    const files = [
      { name: 'hello.txt', content: 'Cozy Strum' },
      { name: 'tabs/song.md', content: '---\ntitle: "Song"\n---\n[Am] [G]\n' }
    ];

    const zipBytes = createZipUint8Array(files);
    assert.ok(zipBytes.length > 50, 'ZIP bytes should not be empty');

    // Local Header 1: PK\x03\x04
    const view = new DataView(zipBytes.buffer, zipBytes.byteOffset, zipBytes.byteLength);
    assert.equal(view.getUint32(0, true), 0x04034b50, 'Local header 1 signature mismatch');

    // End of Central Directory signature: PK\x05\x06 at end - 22 bytes
    const eocdOffset = zipBytes.length - 22;
    assert.equal(view.getUint32(eocdOffset, true), 0x06054b50, 'EOCD signature mismatch');
    assert.equal(view.getUint16(eocdOffset + 10, true), 2, 'Total entries mismatch');
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

  it('creates valid backup JSON with metadata and tab data', () => {
    const jsonStr = createBackupJson(sampleUserTabs, []);
    const parsed = JSON.parse(jsonStr);

    assert.equal(parsed.app, 'the-cozy-strum');
    assert.equal(parsed.version, 1);
    assert.equal(parsed.totalTabs, 1);
    assert.equal(parsed.tabs[0]?.title, 'Wonderwall');
  });

  it('parses valid backup JSON safely', () => {
    const jsonStr = createBackupJson(sampleUserTabs, []);
    const data = parseBackupJson(jsonStr);

    assert.equal(data.totalTabs, 1);
    assert.equal(data.tabs[0]?.artist, 'Oasis');
  });

  it('rejects invalid backup JSON without tabs array', () => {
    assert.throws(() => {
      parseBackupJson('{"app": "other"}');
    }, /Missing "tabs" array/);
  });

  it('restoreTabsFromJson handles corrupt JSON string gracefully', () => {
    const result = restoreTabsFromJson('invalid-json{{{');
    assert.equal(result.success, false);
    assert.equal(result.count, 0);
    assert.ok(result.error);
  });
});
