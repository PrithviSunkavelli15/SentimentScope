const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} = require('@firebase/rules-unit-testing');

const PROJECT_ID = 'demo-sentimentscope';
const RULES_PATH = path.join(__dirname, '../../firestore.rules');

let testEnv;

test.before(async () => {
  assert.ok(
    process.env.FIRESTORE_EMULATOR_HOST,
    'FIRESTORE_EMULATOR_HOST must be set. Run this test with firebase emulators:exec.'
  );
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: fs.readFileSync(RULES_PATH, 'utf8'),
    },
  });
});

test.after(async () => {
  if (testEnv) await testEnv.cleanup();
});

test('a second signed-in user cannot read someone else\'s entry', async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await context.firestore().collection('journalEntries').doc('entry-a').set({
      userId: 'user-a',
      plainText: 'this entry belongs to user a',
    });
  });

  const owner = testEnv.authenticatedContext('user-a');
  const ownerRead = await assertSucceeds(
    owner.firestore().collection('journalEntries').doc('entry-a').get()
  );
  assert.equal(ownerRead.data().userId, 'user-a');

  const otherUser = testEnv.authenticatedContext('user-b');
  await assertFails(
    otherUser.firestore().collection('journalEntries').doc('entry-a').get()
  );
});
