import { ethers } from "hardhat"

// invalid predefined start times
// const invalidFirstStartTime = 1709799300;

// valid predefined start times
// const firstStartTime = 1715069700;

async function main() {
    const invalidTime = 1709799300
    const validTime = 1715069700

    const RefundTimeOverride = await ethers.getContractFactory("RefundTimeOverride")
    const refundTimeOverride = await RefundTimeOverride.deploy(validTime, validTime)
    await refundTimeOverride.deployed()

    console.log("RefundTimeOverride deployed to:", refundTimeOverride.address)
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
