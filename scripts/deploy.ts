import { ethers } from "hardhat";

async function main() {
  // testnet LockDealNFT - 0xe42876a77108E8B3B2af53907f5e533Cba2Ce7BE
  // mainnet LockDealNFT - 0x3d2C83bbBbfB54087d46B80585253077509c21AE
  const lockDealNFt = "0xe42876a77108E8B3B2af53907f5e533Cba2Ce7BE"

  const Web3WarsFix = await ethers.getContractFactory("Web3WarsFix");
  const web3WarsFix = await Web3WarsFix.deploy(lockDealNFt);
  await web3WarsFix.deployed();

  console.log("Web3WarsFix deployed to:", web3WarsFix.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
