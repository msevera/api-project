const DomainBase = require('../../domains/base/domainBase');
const TestDomainA = require('./TestDomainA');
const TestDomainB = require('./TestDomainB');

class TestDomainC extends DomainBase {
  async twoTransactionsInOneDomainTest({ userA, userB }) {
    const testDomainA = new TestDomainA(this.ctx, 'TestModelA');
    await testDomainA.transactionCommitTest({ userA, userB });

    this.ctx.transaction = await this.ctx.startTransaction(this.ctx);

    const testDomainB = new TestDomainB(this.ctx, 'TestModelB');
    await testDomainB.transactionRejectionTest({ userA, userB });
  }
}

module.exports = TestDomainC;
