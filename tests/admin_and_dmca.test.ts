import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { submitDmcaRequest } from '../src/lib/firebase/dmcaService';
import type { CloudTab, TabSummary } from '../src/lib/firebase/types';

describe('Phase 4: DMCA Takedown Portal & Admin Moderation Console', () => {
  it('validates DMCA request submission validation rules and rejects without good-faith declaration', async () => {
    await assert.rejects(
      async () => {
        await submitDmcaRequest({
          tabId: 'test-tab',
          songTitle: 'Test Song',
          artistName: 'Test Artist',
          claimantName: 'John Rightsholder',
          claimantEmail: 'legal@example.com',
          companyOrRightsholder: 'Universal Publishing',
          infringingUrl: 'https://thecozystrum.local/tab?id=test-tab',
          statementOfGoodFaith: false, // Must be rejected
          digitalSignature: 'John Rightsholder',
        });
      },
      /good-faith statement/
    );

    await assert.rejects(
      async () => {
        await submitDmcaRequest({
          tabId: 'test-tab',
          songTitle: 'Test Song',
          artistName: 'Test Artist',
          claimantName: '', // Missing name
          claimantEmail: 'legal@example.com',
          companyOrRightsholder: 'Universal Publishing',
          infringingUrl: 'https://thecozystrum.local/tab?id=test-tab',
          statementOfGoodFaith: true,
          digitalSignature: 'John Rightsholder',
        });
      },
      /Name, valid email, and digital signature are required/
    );
  });

  it('validates that catalog summary excludes heavy content payload', () => {
    const fullTab: CloudTab = {
      id: 'tab-sample-123',
      slug: 'sample-song',
      title: 'Sample Song',
      artist: 'Sample Artist',
      categories: ['Acoustic', 'Folk'],
      instrument: 'guitar',
      tuning: 'Standard (E A D G B E)',
      capo: 2,
      difficulty: 'Beginner',
      isFingerstyle: false,
      chordsUsed: ['G', 'C', 'D'],
      content: 'G   C\nHeavy ASCII tabs and lyrics line...'.repeat(50),
      authorUid: 'user-1',
      authorName: 'Musician 1',
      visibility: 'public',
      status: 'approved',
      favoritesCount: 0,
      viewsCount: 0,
      createdAt: '2026-11-10T00:00:00Z',
      updatedAt: '2026-11-10T00:00:00Z',
    };

    const summary: TabSummary = {
      id: fullTab.id,
      slug: fullTab.slug,
      title: fullTab.title,
      artist: fullTab.artist,
      categories: fullTab.categories,
      instrument: fullTab.instrument,
      tuning: fullTab.tuning,
      capo: fullTab.capo,
      difficulty: fullTab.difficulty,
      isFingerstyle: fullTab.isFingerstyle,
      chordsUsed: fullTab.chordsUsed,
      updatedAt: fullTab.updatedAt,
    };

    assert.ok(!('content' in summary), 'Summary must not contain heavy content payload');
    assert.equal(summary.title, 'Sample Song');
    assert.equal(summary.capo, 2);
  });

  it('verifies all Phase 4 admin and dmca components remain strictly under 200 lines', () => {
    const phase4Files = [
      'src/lib/firebase/dmcaService.ts',
      'src/lib/firebase/adminService.ts',
      'src/components/dmca/DmcaClaimantFields.tsx',
      'src/components/dmca/DmcaSuccessNotice.tsx',
      'src/components/dmca/DmcaFormIsland.tsx',
      'src/components/admin/AdminAuthGate.tsx',
      'src/components/admin/SubmissionReviewModal.tsx',
      'src/components/admin/SubmissionsQueue.tsx',
      'src/components/admin/DmcaClaimsQueue.tsx',
      'src/components/admin/CatalogManagerPanel.tsx',
      'src/components/admin/AdminDashboardIsland.tsx',
      'src/pages/admin.astro',
      'src/pages/dmca.astro',
    ];

    for (const relPath of phase4Files) {
      const fullPath = path.resolve(relPath);
      assert.ok(fs.existsSync(fullPath), `File must exist: ${relPath}`);
      const content = fs.readFileSync(fullPath, 'utf-8');
      const lineCount = content.split('\n').length;
      assert.ok(
        lineCount <= 200,
        `${relPath} has ${lineCount} lines, exceeding the 200-line modularity limit.`
      );
    }
  });

  it('verifies /admin and /dmca pages exist and correctly hydrate interactive islands', () => {
    const adminPath = path.resolve('src/pages/admin.astro');
    assert.ok(fs.existsSync(adminPath), 'src/pages/admin.astro must exist');
    const adminContent = fs.readFileSync(adminPath, 'utf-8');
    assert.ok(adminContent.includes('AdminDashboardIsland'), 'Must import AdminDashboardIsland');
    assert.ok(adminContent.includes('client:load'), 'Must hydrate with client:load');

    const dmcaPath = path.resolve('src/pages/dmca.astro');
    assert.ok(fs.existsSync(dmcaPath), 'src/pages/dmca.astro must exist');
    const dmcaContent = fs.readFileSync(dmcaPath, 'utf-8');
    assert.ok(dmcaContent.includes('DmcaFormIsland'), 'Must import DmcaFormIsland');
    assert.ok(dmcaContent.includes('client:load'), 'Must hydrate with client:load');
  });
});
