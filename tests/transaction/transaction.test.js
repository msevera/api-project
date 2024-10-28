const { getUser } = require('../creators');
const TestDomainA = require('./TestDomainA');
const TestDomainB = require('./TestDomainB');
const TestDomainC = require('./TestDomainC');
const { _defaults } = require('../global');

describe('Transaction', () => {
  test('Transaction committed successfully', async () => {
    const {
      ctx,
      createCtx,
      users: { userA, userB },
    } = _defaults;
    const testDomain = new TestDomainA(ctx, 'TestModel');
    await testDomain.transactionCommitTest({ userA, userB });

    const userA1 = await getUser(
      { ctx, createCtx, authUser: userA },
      {
        userId: userA.id,
      },
    );
    expect(userA1.name).toBe('User A Updated');

    const userB1 = await getUser(
      { ctx, createCtx, authUser: userB },
      {
        userId: userB.id,
      },
    );
    expect(userB1.name).toBe('User B Updated');
  });

  test('Transaction rejected successfully', async () => {
    const {
      ctx,
      createCtx,
      users: { userA, userB },
    } = _defaults;
    const testDomain = new TestDomainA(ctx, 'TestModel');
    try {
      await testDomain.transactionRejectionTest({ userA, userB });
      // eslint-disable-next-line
    } catch {}

    const userA1 = await getUser(
      { ctx, createCtx, authUser: userA },
      {
        userId: userA.id,
      },
    );
    expect(userA1.name).toBe('User A');

    const userB1 = await getUser(
      { ctx, createCtx, authUser: userB },
      {
        userId: userB.id,
      },
    );
    expect(userB1.name).toBe('User B');
  });

  test('With transaction call via another with transaction. Should reject', async () => {
    const {
      ctx,
      createCtx,
      users: { userA, userB, userC },
    } = _defaults;
    const testDomain = new TestDomainA(ctx, 'TestModel');
    try {
      await testDomain.withTransactionCallViaAnotherWithTransaction_shouldReject(
        { userA, userB, userC },
      );
      // eslint-disable-next-line
    } catch {}

    const userA1 = await getUser(
      { ctx, createCtx, authUser: userA },
      {
        userId: userA.id,
      },
    );
    expect(userA1.name).toBe('User A');

    const userB1 = await getUser(
      { ctx, createCtx, authUser: userB },
      {
        userId: userB.id,
      },
    );
    expect(userB1.name).toBe('User B');

    const userC1 = await getUser(
      { ctx, createCtx, authUser: userC },
      {
        userId: userC.id,
      },
    );
    expect(userC1.name).toBe('User C');
  });

  test('With transaction call via another with transaction. Should commit', async () => {
    const {
      ctx,
      createCtx,
      users: { userA, userB, userC },
    } = _defaults;
    const testDomain = new TestDomainA(ctx, 'TestModel');
    await testDomain.withTransactionCallViaAnotherWithTransaction_shouldCommit({
      userA,
      userB,
      userC,
    });

    const userA1 = await getUser(
      { ctx, createCtx, authUser: userA },
      {
        userId: userA.id,
      },
    );
    expect(userA1.name).toBe('User A Updated');

    const userB1 = await getUser(
      { ctx, createCtx, authUser: userB },
      {
        userId: userB.id,
      },
    );
    expect(userB1.name).toBe('User B Updated');

    const userC1 = await getUser(
      { ctx, createCtx, authUser: userC },
      {
        userId: userC.id,
      },
    );
    expect(userC1.name).toBe('User C Updated');
  });

  test('Another domain call tx rejected successfully via', async () => {
    const {
      ctx,
      createCtx,
      users: { userA, userB },
    } = _defaults;
    const testDomain = new TestDomainB(ctx, 'TestModel');
    try {
      await testDomain.transactionRejectionTest({ userA, userB });
      // eslint-disable-next-line
    } catch {}

    const userA1 = await getUser(
      { ctx, createCtx, authUser: userA },
      {
        userId: userA.id,
      },
    );
    expect(userA1.name).toBe('User A');

    const userB1 = await getUser(
      { ctx, createCtx, authUser: userB },
      {
        userId: userB.id,
      },
    );
    expect(userB1.name).toBe('User B');
  });

  test('Two transaction in one domain method', async () => {
    const {
      ctx,
      createCtx,
      users: { userA, userB },
    } = _defaults;
    const testDomain = new TestDomainC(ctx, 'TestModelC');
    try {
      await testDomain.twoTransactionsInOneDomainTest({ userA, userB });
      // eslint-disable-next-line
    } catch {}

    const userA1 = await getUser(
      { ctx, createCtx, authUser: userA },
      {
        userId: userA.id,
      },
    );
    expect(userA1.name).toBe('User A Updated');

    const userB1 = await getUser(
      { ctx, createCtx, authUser: userB },
      {
        userId: userB.id,
      },
    );
    expect(userB1.name).toBe('User B Updated');
  });
});
