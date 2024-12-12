import { ethers } from "hardhat"

async function main() {
    const collateralPoolId = 64841
    const correctTime = 1734017400

    const RefundTimeOverride = await ethers.getContractFactory("RefundTimeOverride")
    const refundTimeOverride = await RefundTimeOverride.deploy(correctTime, collateralPoolId, {
        gasLimit: 10_000_000,
    })
    await refundTimeOverride.deployed()

    console.log("RefundTimeOverride deployed to:", refundTimeOverride.address)
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
