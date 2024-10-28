const DomainBase = require('../../domains/base/domainBase');
const TestDomainA = require('./TestDomainA');

class TestDomainB extends DomainBase {
  async anotherDomainTransactionRejectionTest({ userA, userB }) {
    const testDomainA = new TestDomainA(this.ctx, 'TestModel');
    await testDomainA.transactionRejectionTest({ userA, userB });
  }

  async transactionRejectionTest({ userA, userB }) {
    const { withTransaction, dataSources } = this.ctx;

    await withTransaction(async () => {
      await dataSources.User.editById(userA.id, {
        displayName: 'User A Updated via TestDomainB',
      });

      await dataSources.User.editById(userB.id, {
        displayName: 'User B Updated via TestDomainB',
      });

      throw new Error('Error transaction should reject');
    });
  }
}

module.exports = TestDomainB;
