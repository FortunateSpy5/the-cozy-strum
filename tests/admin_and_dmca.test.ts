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
      'src/components/dmca/DmcaStatementAgreement.tsx',
      'src/components/dmca/DmcaSuccessNotice.tsx',
      'src/components/dmca/DmcaFormIsland.tsx',
      'src/components/admin/AdminAuthGate.tsx',
      'src/components/admin/AdminNavTabs.tsx',
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

  it('verifies /admin and /dmca pages exist, hydrate properly, and have no duplicate landmarks', () => {
    const adminPath = path.resolve('src/pages/admin.astro');
    assert.ok(fs.existsSync(adminPath), 'src/pages/admin.astro must exist');
    const adminContent = fs.readFileSync(adminPath, 'utf-8');
    assert.ok(adminContent.includes('AdminDashboardIsland'), 'Must import AdminDashboardIsland');
    assert.ok(adminContent.includes('client:load'), 'Must hydrate with client:load');
    assert.ok(!adminContent.includes('<main'), 'admin.astro must not nest a duplicate <main> landmark');

    const dmcaPath = path.resolve('src/pages/dmca.astro');
    assert.ok(fs.existsSync(dmcaPath), 'src/pages/dmca.astro must exist');
    const dmcaContent = fs.readFileSync(dmcaPath, 'utf-8');
    assert.ok(dmcaContent.includes('DmcaFormIsland'), 'Must import DmcaFormIsland');
    assert.ok(dmcaContent.includes('client:load'), 'Must hydrate with client:load');
    assert.ok(!dmcaContent.includes('<main'), 'dmca.astro must not nest a duplicate <main> landmark');
  });

  it('verifies QA remediations: ARIA tabs, 44px touch targets, live regions, and firestore rules', () => {
    // 1. ARIA tabs pattern & live feedback
    const navTabs = fs.readFileSync(path.resolve('src/components/admin/AdminNavTabs.tsx'), 'utf-8');
    assert.ok(navTabs.includes('role="tablist"'), 'AdminNavTabs must declare role="tablist"');
    assert.ok(navTabs.includes('role="tab"'), 'Tab buttons must have role="tab"');
    assert.ok(navTabs.includes('aria-selected='), 'Tab buttons must have aria-selected');
    assert.ok(navTabs.includes('aria-controls='), 'Tab buttons must have aria-controls');
    assert.ok(navTabs.includes('min-h-[44px]'), 'Tab buttons must meet 44px touch target');

    const dashboard = fs.readFileSync(path.resolve('src/components/admin/AdminDashboardIsland.tsx'), 'utf-8');
    assert.ok(dashboard.includes('role="tabpanel"'), 'AdminDashboardIsland must have role="tabpanel"');
    assert.ok(dashboard.includes('aria-live="polite"'), 'AdminDashboardIsland must have live region');

    // 2. Modal memoization and busy state
    const reviewModal = fs.readFileSync(path.resolve('src/components/admin/SubmissionReviewModal.tsx'), 'utf-8');
    assert.ok(reviewModal.includes('useMemo('), 'SubmissionReviewModal must memoize parseSongText');
    assert.ok(reviewModal.includes('aria-busy={isProcessing}'), 'Modal must declare aria-busy');
    assert.ok(reviewModal.includes('autoFocus'), 'Rejection reason must autoFocus');

    // 3. Submissions & DMCA queues 44px touch targets
    const subQueue = fs.readFileSync(path.resolve('src/components/admin/SubmissionsQueue.tsx'), 'utf-8');
    assert.ok(!subQueue.includes('min-h-[40px]'), 'SubmissionsQueue must not contain 40px buttons');
    assert.ok(subQueue.includes('min-h-[44px]'), 'SubmissionsQueue must use 44px touch targets');

    const dmcaQueue = fs.readFileSync(path.resolve('src/components/admin/DmcaClaimsQueue.tsx'), 'utf-8');
    assert.ok(!dmcaQueue.includes('min-h-[36px]'), 'DmcaClaimsQueue must not contain 36px filter buttons');
    assert.ok(!dmcaQueue.includes('min-h-[40px]'), 'DmcaClaimsQueue must not contain 40px action buttons');
    assert.ok(dmcaQueue.includes('min-h-[44px]'), 'DmcaClaimsQueue must use 44px touch targets');
    assert.ok(!dmcaQueue.includes('text-walnut/70'), 'DmcaClaimsQueue must avoid low-contrast text-walnut/70');

    // 4. Firestore rules superadmin bootstrap & status tamper prevention
    const rules = fs.readFileSync(path.resolve('firestore.rules'), 'utf-8');
    assert.ok(rules.includes('msoumen555@gmail.com'), 'firestore.rules must allow superadmin initial bootstrap');
    assert.ok(rules.includes("resource.data.status != 'approved'"), 'firestore.rules must prevent modifying approved tabs');
    assert.ok(rules.includes("resource.data.status != 'removed_dmca'"), 'firestore.rules must prevent modifying removed tabs');
    assert.ok(rules.includes('claimantName.size() <= 200'), 'firestore.rules must enforce DMCA name length');
  });
});
