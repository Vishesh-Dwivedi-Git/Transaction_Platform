const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Transaction Contract", function () {
    let Transaction, transaction, owner, addr1, addr2;

    beforeEach(async function () {
        // Get signers
        [owner, addr1, addr2] = await ethers.getSigners();

        // Deploy the contract
        Transaction = await ethers.getContractFactory("Transaction");
        transaction = await Transaction.deploy(); // ✅ FIXED: No need for `.deployed()`
    });

    it("Should initialize with zero transactions", async function () {
        const count = await transaction.getTransactionCount();
        expect(count).to.equal(0);
    });

    it("Should add a transaction successfully", async function () {
        await transaction.connect(addr1).addToBlockchain(addr2.address, 100, "Test Message", "Test");
        const count = await transaction.getTransactionCount();
        expect(count).to.equal(1);
    });

    it("Should return all transactions", async function () {
        await transaction.connect(addr1).addToBlockchain(addr2.address, 100, "Hello", "Test1");
        await transaction.connect(addr2).addToBlockchain(addr1.address, 200, "Hey", "Test2");

        const transactions = await transaction.getAllTransactions();
        expect(transactions.length).to.equal(2);
        expect(transactions[0].amount).to.equal(100);
        expect(transactions[1].amount).to.equal(200);
    });
});
