import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

describe('Phase 5: Local Audio + LRCLIB Chord Sync Pipeline', () => {
  const syncDir = path.resolve('tools/chord-sync');

  it('verifies all tools/chord-sync Python files exist and are strictly under 200 lines', () => {
    assert.ok(fs.existsSync(syncDir), 'tools/chord-sync directory must exist');

    const expectedFiles = [
      'requirements.txt',
      'README.md',
      '__init__.py',
      'lrc_fetcher.py',
      'chord_extractor_wrapper.py',
      'chord_aligner.py',
      'firestore_uploader.py',
      'sync_generator.py',
      'test_aligner.py',
    ];

    for (const file of expectedFiles) {
      const fullPath = path.join(syncDir, file);
      assert.ok(fs.existsSync(fullPath), `Expected file must exist: tools/chord-sync/${file}`);

      const content = fs.readFileSync(fullPath, 'utf-8');
      const lineCount = content.split('\n').length;
      assert.ok(
        lineCount <= 200,
        `tools/chord-sync/${file} has ${lineCount} lines, exceeding the 200-line modularity limit.`
      );
    }
  });

  it('executes python test_aligner.py unit tests and verifies 100% pass', () => {
    try {
      const output = execSync('python tools/chord-sync/test_aligner.py', {
        encoding: 'utf-8',
        timeout: 10000,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      // In python, unittest writes runner output to stderr
      assert.ok(true, 'Test execution completed');
    } catch (err: unknown) {
      // If execSync fails (non-zero exit code)
      const errorMsg = err instanceof Error ? err.message : String(err);
      assert.fail(`Python unit tests failed with non-zero exit code: ${errorMsg}`);
    }
  });

  it('verifies sync_generator.py CLI help output contains required arguments', () => {
    try {
      const output = execSync('python tools/chord-sync/sync_generator.py --help', {
        encoding: 'utf-8',
        timeout: 10000,
      });
      assert.ok(output.includes('--title TITLE'), 'CLI must require --title');
      assert.ok(output.includes('--artist ARTIST'), 'CLI must require --artist');
      assert.ok(output.includes('--audio AUDIO'), 'CLI must support --audio');
      assert.ok(output.includes('--lrc-file LRC_FILE'), 'CLI must support --lrc-file');
      assert.ok(output.includes('--upload'), 'CLI must support --upload');
      assert.ok(output.includes('--dry-run'), 'CLI must support --dry-run');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      assert.fail(`CLI help check failed: ${errorMsg}`);
    }
  });
});
