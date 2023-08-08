import { expect } from "chai"
import { ethers } from "hardhat"

describe("ElepToken Contract", () => {
  it("Deployment should assign he total supply of tokens to the owner", async () => {
    const [owner] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("ElepToken");
    const elepToken = await Token.deploy();
    const ownerBalance = await elepToken.balanceOf(owner.address);
    expect(await elepToken.totalSupply()).to.equal(ownerBalance);
  })
})
