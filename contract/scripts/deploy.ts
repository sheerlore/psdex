import { ethers } from "hardhat"

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const Token = await ethers.getContractFactory("ElepToken");
  const elepToken = await Token.deploy();

  console.log("Token address", elepToken.getAddress())
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
