import { expect } from "chai"
import { ethers } from "hardhat"

import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers"

describe("ElepToken Contract", function () {
  const MINTER_ROLE = ethers.id("MINTER_ROLE");
  const PAUSER_ROLE = ethers.id("PAUSER_ROLE");
  const invalidAddress = ethers.ZeroAddress;

  async function deployTokenFixture() {
    const initialSupply = 1000;
    const [owner, addr1, addr2] = await ethers.getSigners();
    const ElepToken = await ethers.deployContract("ElepToken");
    await ElepToken.mint(owner.address, initialSupply);
    await ElepToken.waitForDeployment();

    return { ElepToken, owner, addr1, addr2 };
  }

  describe("Deploy Contract", function () {
    it("should have correct name", async function () {
      const { ElepToken } = await loadFixture(deployTokenFixture);
      expect(await ElepToken.name()).to.equal("ElepToken")
    })

    it("should have correct symbol", async function () {
      const { ElepToken } = await loadFixture(deployTokenFixture);
      expect(await ElepToken.symbol()).to.equal("ELP")
    })

    it("should have 18 decimals", async function () {
      const { ElepToken } = await loadFixture(deployTokenFixture);
      expect(await ElepToken.decimals()).to.equal("18")
    })

    it("should assign the total supply of tokens to the owner", async function () {
      const { ElepToken, owner } = await loadFixture(deployTokenFixture);
      const ownerBalance = await ElepToken.balanceOf(owner.address);
      expect(await ElepToken.totalSupply()).to.equal(ownerBalance);
    });

    it("should set owner is MINTER_ROLE", async function () {
      const { ElepToken, owner } = await loadFixture(deployTokenFixture);
      expect(
        await ElepToken.hasRole(MINTER_ROLE, owner.address)
      ).is.true;
    })

    it("should set owner is PAUSER_ROLE", async function () {
      const { ElepToken, owner } = await loadFixture(deployTokenFixture);
      expect(
        await ElepToken.hasRole(PAUSER_ROLE, owner.address)
      ).is.true;
    })
  })

  describe("Pause/UnPause", function () {
    it("contract must not be paused after deploy", async function () {
      const { ElepToken } = await loadFixture(deployTokenFixture);
      expect(await ElepToken.paused()).is.false;
    })

    it("should throw if account is not admin", async function () {
      const { ElepToken, addr1 } = await loadFixture(deployTokenFixture);
      const other = ElepToken.connect(addr1);
      expect(other.pause()).to.be.reverted;
    })

    it("shoud emit 'Paused' event after pause()", async function () {
      const { ElepToken, owner } = await loadFixture(deployTokenFixture);
      await expect(ElepToken.pause())
        .to.emit(ElepToken, "Paused")
        .withArgs(owner.address);
    })

    it("shoud throw if contract already puased", async function () {
      const { ElepToken } = await loadFixture(deployTokenFixture);
      await ElepToken.pause();
      expect(ElepToken.pause()).to.be.reverted;
    })
    it("shoud emit 'Unpaused' event after unpuase()", async function () {
      const { ElepToken, owner } = await loadFixture(deployTokenFixture);
      await ElepToken.pause();
      await expect(ElepToken.unpause())
        .to.emit(ElepToken, "Unpaused")
        .withArgs(owner.address);
    })
  })

  describe("Mint", function () {
    it("should throw if contract is paused", async function () {
      const { ElepToken, owner } = await loadFixture(deployTokenFixture);
      await ElepToken.pause();
      expect(await ElepToken.paused()).is.true;
      expect(ElepToken.mint(owner.address, 1000)).to.be.reverted;
    })

    it("should throw if to address is invalid", async function () {
      const { ElepToken } = await loadFixture(deployTokenFixture);
      expect(ElepToken.mint(invalidAddress, 1000)).to.be.reverted;
    })

    it("should throw if account is not a minter", async function () {
      const { ElepToken, addr1 } = await loadFixture(deployTokenFixture);
      const other = ElepToken.connect(addr1);
      expect(await ElepToken.hasRole(MINTER_ROLE, addr1.address)).is.false;
      expect(other.mint(addr1.address, 1000)).to.be.reverted;
    })

    it("Account should have correct amount with 'Transfer' event after mint()", async function () {
      const { ElepToken, owner } = await loadFixture(deployTokenFixture);
      const mintValue: bigint = 1000n;
      const initialBalance = await ElepToken.balanceOf(owner.address);
      const totalSupplyBeforeMint = await ElepToken.totalSupply();
      const expectedTotalSupply = totalSupplyBeforeMint + mintValue;
      const mintRes = await ElepToken.mint(owner.address, mintValue);
      const totalSupplyAfterMint = await ElepToken.totalSupply();
      expect(expectedTotalSupply).to.equal(totalSupplyAfterMint);
      expect(await ElepToken.balanceOf(owner.address)).to.equal(initialBalance + mintValue);
      await expect(mintRes)
        .to.emit(ElepToken, "Transfer")
        .withArgs(ethers.ZeroAddress, owner.address, mintValue);
    })
  })

  describe("Transfer", function () {
    const transferValue = 500;

    it("should throw if contract is puased", async function () {
      const { ElepToken, addr1 } = await loadFixture(deployTokenFixture);
      await ElepToken.pause();
      expect(ElepToken.transfer(addr1, transferValue)).to.be.reverted;
    })

    it("should throw if to address is not valid", async function () {
      const { ElepToken } = await loadFixture(deployTokenFixture);
      expect(ElepToken.transfer(invalidAddress, transferValue)).to.be.reverted;
    })

    it("should throw if balance is insufficient", async function () {
      const { ElepToken, owner, addr1 } = await loadFixture(deployTokenFixture);
      const fromBalance = await ElepToken.balanceOf(owner.address);
      expect(ElepToken.transfer(addr1, fromBalance + BigInt(transferValue))).to.be.reverted;
    })

    it("Accounts should have correct amount with 'Transfer' event when successful", async function () {
      const { ElepToken, owner, addr1 } = await loadFixture(deployTokenFixture);
      const fromAddress = owner.address;
      const toAddress = addr1.address;
      const fromBalanceBeforeTransfer = await ElepToken.balanceOf(fromAddress);
      const toBalanceBeforeTransfer = await ElepToken.balanceOf(toAddress);
      const transferRes = await ElepToken.transfer(toAddress, transferValue);
      const fromBalanceAfterTransfer = await ElepToken.balanceOf(fromAddress);
      const toBalanceAfterTransfer = await ElepToken.balanceOf(toAddress);
      expect(fromBalanceAfterTransfer)
        .to.equal(fromBalanceBeforeTransfer - BigInt(transferValue))
      expect(toBalanceAfterTransfer)
        .to.equal(toBalanceBeforeTransfer + BigInt(transferValue))
      await expect(transferRes)
        .to.emit(ElepToken, "Transfer")
        .withArgs(fromAddress, toAddress, transferValue);
    })
  })

  describe("Approve", function () {
    const spendValue = 500;
    it("should throw if contract is paused", async function () {
      const { ElepToken, owner, addr1 } = await loadFixture(deployTokenFixture);
      await ElepToken.pause();
      expect(ElepToken.approve(addr1, spendValue)).to.be.reverted;
    })

    it("should emit 'Approve' event if successful", async function () {
      const { ElepToken, owner, addr1 } = await loadFixture(deployTokenFixture);
      const approveRes = await ElepToken.approve(addr1, spendValue);
      await expect(approveRes)
        .to.emit(ElepToken, "Approval")
        .withArgs(owner.address, addr1.address, spendValue);
    })
  })

  describe("Transfer From", function () {
    const spendValue = 500
    const transferValue = 100;

    it("should throw if contract is paused", async function () {
      const { ElepToken, owner, addr1, addr2 } = await loadFixture(deployTokenFixture);
      await ElepToken.pause();
      await ElepToken.approve(addr1.address, spendValue);
      const other = ElepToken.connect(addr1);
      expect(other.transferFrom(owner.address, addr2.address, transferValue)).to.be.reverted;
    })

    it("should throw if from address is not valid", async function () {
      const { ElepToken, addr1 } = await loadFixture(deployTokenFixture);
      expect(ElepToken.transferFrom(invalidAddress, addr1.address, transferValue)).to.be.reverted;
    })

    it("should throw if to address is not valid", async function () {
      const { ElepToken, addr1 } = await loadFixture(deployTokenFixture);
      expect(ElepToken.transferFrom(addr1.address, invalidAddress, transferValue)).to.be.reverted;
    })

    it("should throw if balance is insufficient", async function () {
      const { ElepToken, addr1, addr2 } = await loadFixture(deployTokenFixture);
      expect(ElepToken.transferFrom(addr1.address, addr2.address, transferValue)).to.be.reverted;
    })

    it("should throw if sender is not approved", async function () {
      const { ElepToken, owner, addr1 } = await loadFixture(deployTokenFixture);
      const other = ElepToken.connect(addr1);
      expect(other.transferFrom(owner.address, addr1.address, transferValue)).to.be.reverted;
    })

    it("should throw if approval is not enoughth", async function () {
      const { ElepToken, owner, addr1 } = await loadFixture(deployTokenFixture);
      await ElepToken.approve(addr1.address, spendValue);
      const other = ElepToken.connect(addr1);
      expect(other.transferFrom(owner.address, addr1.address, spendValue * 2)).to.be.reverted;
    })

    it("should emit 'Transfer' event when successful", async function () {
      const { ElepToken, owner, addr1 } = await loadFixture(deployTokenFixture);
      await ElepToken.approve(addr1.address, spendValue);
      const ownerBalanceBeforeTransfer = await ElepToken.balanceOf(owner.address);
      const addr1BalanceBeforeTransfer = await ElepToken.balanceOf(addr1.address);
      const other = ElepToken.connect(addr1);
      const transferFromRes = await other.transferFrom(owner.address, addr1.address, transferValue);
      expect(await ElepToken.balanceOf(addr1.address))
        .to.equal(addr1BalanceBeforeTransfer + BigInt(transferValue));
      expect(await ElepToken.balanceOf(owner.address))
        .to.equal(ownerBalanceBeforeTransfer - BigInt(transferValue));
      await expect(transferFromRes)
        .to.emit(ElepToken, "Transfer")
        .withArgs(owner.address, addr1.address, transferValue);
    })
  })

  describe("Allowance", function () {
    const spendValue = 500;

    it("should throw if contract is puased", async function () {
      const { ElepToken, owner, addr1 } = await loadFixture(deployTokenFixture);
      await ElepToken.approve(addr1.address, spendValue);
      await ElepToken.pause();
      expect(ElepToken.allowance(owner.address, addr1.address)).to.be.reverted;
    })

    it("should 0 if not allowance", async function () {
      const { ElepToken, owner, addr1 } = await loadFixture(deployTokenFixture);
      expect(await ElepToken.allowance(owner.address, addr1.address)).to.equal(0n);
    })

    it("should return the correct amount", async function () {
      const { ElepToken, owner, addr1 } = await loadFixture(deployTokenFixture);
      await ElepToken.approve(addr1.address, spendValue);
      expect(await ElepToken.allowance(owner.address, addr1.address)).to.equal(spendValue);
    })
  })

  describe("IncreaseApproval", function () {
    const spendValue = 500;
    const increaseValue = 100;

    it("should throw if contracct is paused", async function () {
      const { ElepToken, addr1 } = await loadFixture(deployTokenFixture);
      await ElepToken.approve(addr1.address, spendValue);
      await ElepToken.pause();
      expect(ElepToken.increaseAllowance(addr1.address, increaseValue)).to.be.reverted;
    })

    it("should increase the correct amount with 'Approval' event", async function () {
      const { ElepToken, owner, addr1 } = await loadFixture(deployTokenFixture);
      await ElepToken.approve(addr1.address, spendValue);
      const incAllowanceRes = await ElepToken.increaseAllowance(addr1, increaseValue);
      const finalSpendValue = spendValue + increaseValue;
      expect(await ElepToken.allowance(owner.address, addr1.address)).to.equal(finalSpendValue);
      await expect(incAllowanceRes)
        .to.emit(ElepToken, "Approval")
        .withArgs(owner.address, addr1.address, finalSpendValue)
    })
  })

  describe("DecreaseApproval", function () {
    const spendValue = 500;
    const decreaseValue = 100;

    it("should throw if contracct is paused", async function () {
      const { ElepToken, addr1 } = await loadFixture(deployTokenFixture);
      await ElepToken.approve(addr1.address, spendValue);
      await ElepToken.pause();
      expect(ElepToken.decreaseAllowance(addr1.address, decreaseValue)).to.be.reverted;
    })

    it("should decrease the correct amount with 'Approval' event", async function () {
      const { ElepToken, owner, addr1 } = await loadFixture(deployTokenFixture);
      await ElepToken.approve(addr1.address, spendValue);
      const incAllowanceRes = await ElepToken.decreaseAllowance(addr1, decreaseValue);
      const finalSpendValue = spendValue - decreaseValue;
      expect(await ElepToken.allowance(owner.address, addr1.address)).to.equal(finalSpendValue);
      await expect(incAllowanceRes)
        .to.emit(ElepToken, "Approval")
        .withArgs(owner.address, addr1.address, finalSpendValue)
    })
  })

  describe("BurnFrom", function () {
    const burnValue = 100;

    it("should throw if contract is paused", async function () {
      const { ElepToken, owner } = await loadFixture(deployTokenFixture);
      await ElepToken.pause();
      expect(ElepToken.burnFrom(owner.address, burnValue)).to.be.reverted;
    })

    it("should throw if from account is invalid", async function () {
      const { ElepToken } = await loadFixture(deployTokenFixture);
      expect(ElepToken.burnFrom(invalidAddress, burnValue)).to.be.reverted;
    })

    it("should throw if balance is insufficient", async function () {
      const { ElepToken, owner, addr1 } = await loadFixture(deployTokenFixture);
      expect(ElepToken.burnFrom(addr1.address, burnValue)).to.be.reverted;
    })

    it("should throw if account is not approved", async function () {
      const { ElepToken, owner, addr1 } = await loadFixture(deployTokenFixture);
      const other = ElepToken.connect(addr1);
      expect(other.burnFrom(owner.address, burnValue)).to.be.reverted;
    })

    it("Account should have correct amount with 'Transfer' evnet when successful", async function () {
      const { ElepToken, addr1, addr2 } = await loadFixture(deployTokenFixture);
      const mintValue = 300
      const spendValue = 200;
      await ElepToken.mint(addr1, mintValue);
      const other1 = ElepToken.connect(addr1)
      const other2 = ElepToken.connect(addr2);
      await other1.approve(addr2.address, spendValue);
      const burnFromRes = await other2.burnFrom(addr1.address, burnValue);
      const addr1BalanceAfterBurn = await ElepToken.balanceOf(addr1)
      expect(addr1BalanceAfterBurn).to.equal(mintValue - burnValue);
      await expect(burnFromRes)
        .to.emit(other2, "Transfer")
        .withArgs(addr1.address, ethers.ZeroAddress, burnValue);
    })
  })

  describe("Burn", function () {
    const burnValue = 100;

    it("should throw if contract is paused", async function () {
      const { ElepToken, owner } = await loadFixture(deployTokenFixture);
      await ElepToken.pause();
      expect(ElepToken.burn(burnValue)).to.be.reverted;
    })
    it("should throw if balance is insufficient", async function () {
      const { ElepToken, addr1, addr2 } = await loadFixture(deployTokenFixture);
      const other = ElepToken.connect(addr1);
      expect(other.burn(burnValue)).to.be.reverted;
    })

    it("Account should have correct amount with 'Transfer' event when successful", async function () {
      const { ElepToken, owner } = await loadFixture(deployTokenFixture);
      const ownerBalanceBeforeBurn = await ElepToken.balanceOf(owner.address);
      const burnRes = await ElepToken.burn(burnValue);
      const ownerBalanceAfterBurn = await ElepToken.balanceOf(owner.address);
      expect(ownerBalanceAfterBurn).to.equal(ownerBalanceBeforeBurn - BigInt(burnValue));
      await expect(burnRes)
        .to.emit(ElepToken, "Transfer")
        .withArgs(owner.address, ethers.ZeroAddress, burnValue);
    })
  })
})
