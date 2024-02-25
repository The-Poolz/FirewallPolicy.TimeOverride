import { ERC20Token, MockVaultManager, Web3WarsFix } from "../typechain-types"
import { LockDealNFT } from "../typechain-types"
import { LockDealProvider, DealProvider } from "../typechain-types"
import { time, mine, takeSnapshot, SnapshotRestorer } from "@nomicfoundation/hardhat-network-helpers"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { deployed } from "@poolzfinance/poolz-helper-v2"
import { expect } from "chai"
import { ethers } from "hardhat"

describe("Web3WarsFix tests", function () {
    const functionSelector = "0x2e1a7d4d" // bytes4(keccak256("withdraw(uint256)"))
    let lockProvider: LockDealProvider
    let lockDealNFT: LockDealNFT
    let web3WarsFix: Web3WarsFix
    let token: ERC20Token
    let mockVaultManager: MockVaultManager
    let poolId: number
    let receiver: SignerWithAddress
    let addresses: string[]
    let snapShot: SnapshotRestorer
    let params: [number, number]
    const amount = 10000
    const MAX_RATIO = ethers.utils.parseUnits("1", 21)
    const signature: Uint8Array = ethers.utils.toUtf8Bytes("signature")

    // invalid predefined start times
    const invalidFirstStartTime = 1709799300
    const invalidSecondStartTime = 1712477700
    const invalidThirdStartTime = 1715069700
    const invalidFourthStartTime = 1717748100

    // valid predefined start times
    const firstStartTime = 1715069700
    const secondStartTime = 1723018500
    const thirdStartTime = 1730967300
    const fourthStartTime = 1738916100

    before(async () => {
        [receiver] = await ethers.getSigners()
        token = (await deployed("ERC20Token", "TEMP")) as ERC20Token
        mockVaultManager = (await deployed("MockVaultManager")) as MockVaultManager
        lockDealNFT = (await deployed("LockDealNFT", mockVaultManager.address, "")) as LockDealNFT
        const dealProvider = (await deployed("DealProvider", lockDealNFT.address)) as DealProvider
        lockProvider = (await deployed(
            "LockDealProvider",
            lockDealNFT.address,
            dealProvider.address
        )) as LockDealProvider
        await lockDealNFT.setApprovedContract(lockProvider.address, true)
        await token.approve(mockVaultManager.address, MAX_RATIO.mul(10))
        await mockVaultManager.setWeb3War(true)
        snapShot = await takeSnapshot()
    })

    afterEach(async () => {
        await snapShot.restore()
    })

    async function createNewPool(invalidTime: number, validTime: number) {
        poolId = (await lockDealNFT.totalSupply()).toNumber()
        params = [amount, invalidTime]
        addresses = [receiver.address, token.address]
        await lockProvider.createNewPool(addresses, params, signature)
        web3WarsFix = (await deployed(
            "Web3WarsFix",
            lockDealNFT.address,
            invalidTime.toString(),
            validTime.toString(),
            "10"
        )) as Web3WarsFix
    }

    it("should revert first check after invalid time", async () => {
        await createNewPool(invalidFirstStartTime, firstStartTime)
        await time.setNextBlockTimestamp(invalidFirstStartTime)
        await mine(1)
        await expect(
            web3WarsFix.preExecution(receiver.address, receiver.address, functionSelector, 0)
        ).to.be.rejectedWith("Web3WarsFix: invalid time")
    })

    it("should revert second check after invalid time", async () => {
        await createNewPool(invalidSecondStartTime, secondStartTime)
        await time.setNextBlockTimestamp(invalidSecondStartTime)
        await mine(1)
        await expect(
            web3WarsFix.preExecution(receiver.address, receiver.address, functionSelector, 0)
        ).to.be.rejectedWith("Web3WarsFix: invalid time")
    })

    it("should revert third check after invalid time", async () => {
        await createNewPool(invalidThirdStartTime, thirdStartTime)
        await time.setNextBlockTimestamp(invalidThirdStartTime)
        await mine(1)
        await expect(
            web3WarsFix.preExecution(receiver.address, receiver.address, functionSelector, 0)
        ).to.be.rejectedWith("Web3WarsFix: invalid time")
    })

    it("should revert fourth check after invalid time", async () => {
        await createNewPool(invalidFourthStartTime, fourthStartTime)
        await time.setNextBlockTimestamp(invalidFourthStartTime)
        await mine(1)
        await expect(
            web3WarsFix.preExecution(receiver.address, receiver.address, functionSelector, 0)
        ).to.be.rejectedWith("Web3WarsFix: invalid time")
    })

    it("should pass first check after valid time", async () => {
        await createNewPool(invalidFirstStartTime, firstStartTime)
        await time.setNextBlockTimestamp(firstStartTime)
        await mine(1)
        await expect(web3WarsFix.preExecution(receiver.address, receiver.address, functionSelector, 0)).to.not.be
            .rejected
    })

    it("should pass second check after valid time", async () => {
        await createNewPool(invalidSecondStartTime, secondStartTime)
        await time.setNextBlockTimestamp(secondStartTime)
        await mine(1)
        await expect(web3WarsFix.preExecution(receiver.address, receiver.address, functionSelector, 0)).to.not.be
            .rejected
    })

    it("should pass third check after valid time", async () => {
        await createNewPool(invalidThirdStartTime, thirdStartTime)
        await time.setNextBlockTimestamp(thirdStartTime)
        await mine(1)
        await expect(web3WarsFix.preExecution(receiver.address, receiver.address, functionSelector, 0)).to.not.be
            .rejected
    })

    it("should pass fourth check after valid time", async () => {
        await createNewPool(invalidFourthStartTime, fourthStartTime)
        await time.setNextBlockTimestamp(fourthStartTime)
        await mine(1)
        await expect(web3WarsFix.preExecution(receiver.address, receiver.address, functionSelector, 0)).to.not.be
            .rejected
    })
})