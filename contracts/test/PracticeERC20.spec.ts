import { expect } from "chai"
import { ethers } from "hardhat"

import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers"

describe("PracticeERC20 Token", function () {
  const name = "HarryPotterObamaSonic10Inu";
  const symbol = "BITCOIN";
  const decimals = 18;
  const totalSupply = 1000;

  async function deployTokenFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("PracticeERC20");
    const token = await Token.deploy(name, symbol, decimals, totalSupply);
    await token.waitForDeployment();

    return { token, owner, addr1, addr2 };
  }

  describe("Deployment", function () {
    it("should have correct name", async function () {
      const { token } = await loadFixture(deployTokenFixture);
      expect(await token.name()).to.equal(name);
    })

    it("should have correct symbol", async function () {
      const { token } = await loadFixture(deployTokenFixture);
      expect(await token.symbol()).to.equal(symbol);
    })

    it("should have correct totalSupply", async function () {
      const { token } = await loadFixture(deployTokenFixture);
      expect(await token.totalSupply()).to.equal(totalSupply);
    })
  })

  describe("Transfer", function () {
    it("送金額よりも初期残高が少ないと失敗する", async () => {
      const { token, addr1, owner } = await loadFixture(deployTokenFixture);
      const initialFromBalance = await token.balanceOf(owner.address)
      expect(token.transfer(addr1, initialFromBalance + BigInt(1))).to.be.reverted;
    })
    it("送金後の残高の変化がただしい", async () => {
      const { token, addr1, owner } = await loadFixture(deployTokenFixture);
      const amount = BigInt(1);
      const initialFromBalance = await token.balanceOf(owner.address)
      const initialToBalance = await token.balanceOf(addr1.address)
      await token.transfer(addr1.address, amount) // ownerで実行する
      expect(await token.balanceOf(owner.address)).to.equal(initialFromBalance - amount);
      expect(await token.balanceOf(addr1.address)).to.equal(initialToBalance + amount);
    })
  })

  it("")
  it("")
})
