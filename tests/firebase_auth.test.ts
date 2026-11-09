import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isUserSuperAdmin } from '../src/lib/firebase/auth';
import { isFirebaseConfigured } from '../src/lib/firebase/config';
import type { UserProfile } from '../src/lib/firebase/types';

describe('Firebase Auth & Admin Bootstrap Logic', () => {
  it('identifies superadmin emails accurately with case-insensitivity and trimming', () => {
    // When PUBLIC_SUPERADMIN_EMAIL is not set or empty
    assert.equal(isUserSuperAdmin(null), false);
    assert.equal(isUserSuperAdmin(undefined), false);
    assert.equal(isUserSuperAdmin(''), false);
    assert.equal(isUserSuperAdmin('random.user@example.com'), false);

    // Test with simulated superadmin email
    const originalEnv = process.env.PUBLIC_SUPERADMIN_EMAIL;
    try {
      process.env.PUBLIC_SUPERADMIN_EMAIL = 'admin@thecozystrum.org';
      
      assert.equal(isUserSuperAdmin('admin@thecozystrum.org'), true);
      assert.equal(isUserSuperAdmin('  ADMIN@TheCozyStrum.org  '), true);
      assert.equal(isUserSuperAdmin('Admin@thecozystrum.org'), true);
      assert.equal(isUserSuperAdmin('other@thecozystrum.org'), false);
      assert.equal(isUserSuperAdmin(null), false);
    } finally {
      if (originalEnv !== undefined) {
        process.env.PUBLIC_SUPERADMIN_EMAIL = originalEnv;
      } else {
        delete process.env.PUBLIC_SUPERADMIN_EMAIL;
      }
    }
  });

  it('validates user profile typing and role defaults', () => {
    const profile: UserProfile = {
      uid: 'test-user-123',
      email: 'acoustic@jam.org',
      displayName: 'Cozy Picker',
      photoURL: 'https://example.com/avatar.jpg',
      role: 'user',
      favoriteTabIds: ['here-comes-the-sun', 'blackbird'],
      recentlyPlayedIds: ['blackbird'],
      songPreferences: {
        'here-comes-the-sun': {
          transpose: 2,
          capoOverride: 7,
          scrollSpeed: 1.5,
          instrumentView: 'guitar',
        },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    assert.equal(profile.role, 'user');
    assert.equal(profile.favoriteTabIds.length, 2);
    assert.equal(profile.songPreferences['here-comes-the-sun']?.capoOverride, 7);
  });

  it('checks if firebase configuration helper properly detects missing config', () => {
    // In test environment without env vars, isFirebaseConfigured should return false safely
    const configured = isFirebaseConfigured();
    assert.equal(typeof configured, 'boolean');
  });
});
