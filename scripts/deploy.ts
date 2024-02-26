import { ethers } from "hardhat"

// invalid predefined start times
// const invalidFirstStartTime = 1709799300;
// const invalidSecondStartTime = 1712477700;
// const invalidThirdStartTime = 1715069700;
// const invalidFourthStartTime = 1717748100;

// valid predefined start times
// const firstStartTime = 1715069700;
// const secondStartTime = 1723018500;
// const thirdStartTime = 1730967300;
// const fourthStartTime = 1738916100;

async function main() {
    // testnet LockDealNFT - 0xe42876a77108E8B3B2af53907f5e533Cba2Ce7BE
    // mainnet LockDealNFT - 0x3d2C83bbBbfB54087d46B80585253077509c21AE
    const lockDealNFt = "0xe42876a77108E8B3B2af53907f5e533Cba2Ce7BE"
    const vaultId = 10
    const invalidTime = 1709799300
    const validTime = 1715069700

    const Web3WarsFix = await ethers.getContractFactory("LockTimeOverride")
    const web3WarsFix = await Web3WarsFix.deploy(lockDealNFt, invalidTime, validTime, vaultId)
    await web3WarsFix.deployed()

    console.log("LockTimeOverride deployed to:", web3WarsFix.address)
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
