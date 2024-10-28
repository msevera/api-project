const DomainBase = require('../../domains/base/domainBase');

class TestDomainA extends DomainBase {
  async transactionCommitTest({ userA, userB }) {
    const { withTransaction, dataSources } = this.ctx;

    await withTransaction(async () => {
      await dataSources.User.editById(userA.id, {
        name: 'User A Updated',
      });

      await dataSources.User.editById(userB.id, {
        name: 'User B Updated',
      });
    });
  }

  async transactionRejectionTest({ userA, userB }) {
    const { withTransaction, dataSources } = this.ctx;

    await withTransaction(async () => {
      await dataSources.User.editById(userA.id, {
        name: 'User A Updated',
      });

      await dataSources.User.editById(userB.id, {
        name: 'User B Updated',
      });

      throw new Error('Error transaction should reject');
    });
  }

  async withTransactionCallViaAnotherWithTransaction_shouldReject({
    userA,
    userB,
    userC,
  }) {
    const { withTransaction, dataSources } = this.ctx;

    await withTransaction(async () => {
      await dataSources.User.editById(userC.id, {
        name: 'User C Updated',
      });
      await this.transactionRejectionTest({ userA, userB });
    });
  }

  async withTransactionCallViaAnotherWithTransaction_shouldCommit({
    userA,
    userB,
    userC,
  }) {
    const { withTransaction, dataSources } = this.ctx;

    await withTransaction(async () => {
      await dataSources.User.editById(userC.id, {
        name: 'User C Updated',
      });
      await this.transactionCommitTest({ userA, userB });
    });
  }
}

module.exports = TestDomainA;
