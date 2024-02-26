import { ERC20Token, MockFirewall, MockVaultManager, LockTimeOverride } from "../typechain-types"
import { LockDealNFT } from "../typechain-types"
import { LockDealProvider, DealProvider } from "../typechain-types"
import { time, mine, takeSnapshot, SnapshotRestorer } from "@nomicfoundation/hardhat-network-helpers"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { deployed } from "@poolzfinance/poolz-helper-v2"
import { expect } from "chai"
import { ethers } from "hardhat"

describe("Firewall tests", function () {
    let lockProvider: LockDealProvider
    let lockDealNFT: LockDealNFT
    let lockTimeOverride: LockTimeOverride
    let firewall: MockFirewall
    let token: ERC20Token
    let mockVaultManager: MockVaultManager
    let poolId: number
    let receiver: SignerWithAddress
    let addresses: string[]
    let snapShot: SnapshotRestorer
    let params: [string, number]
    const amount = ethers.utils.parseUnits("1", 18)
    const MAX_RATIO = ethers.utils.parseUnits("1", 21)
    const signature: Uint8Array = ethers.utils.toUtf8Bytes("signature")
    const invalidFirstStartTime = 1709799300
    const firstStartTime = 1715069700

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
        lockTimeOverride = (await deployed(
            "LockTimeOverride",
            lockDealNFT.address,
            invalidFirstStartTime.toString(),
            firstStartTime.toString(),
            "10"
        )) as LockTimeOverride
        firewall = (await deployed("MockFirewall", lockTimeOverride.address)) as MockFirewall
        await mockVaultManager.setWeb3War(true)
        await lockProvider.setFirewall(firewall.address)
        snapShot = await takeSnapshot()
    })

    afterEach(async () => {
        await snapShot.restore()
    })

    async function createNewPool(invalidTime: number) {
        poolId = (await lockDealNFT.totalSupply()).toNumber()
        params = [amount.toString(), invalidTime]
        addresses = [receiver.address, token.address]
        await lockProvider.createNewPool(addresses, params, signature)
    }

    it("should revert withdraw tokens before valid time", async () => {
        await createNewPool(invalidFirstStartTime)
        await time.setNextBlockTimestamp(invalidFirstStartTime)
        await expect(
            lockDealNFT
                .connect(receiver)
                ["safeTransferFrom(address,address,uint256)"](receiver.address, lockDealNFT.address, poolId)
        ).to.be.rejectedWith("LockTimeOverride: invalid time")
    })

    it("should pass withdraw tokens after valid time", async () => {
        await createNewPool(invalidFirstStartTime)
        await time.setNextBlockTimestamp(firstStartTime)
        await expect(
            lockDealNFT
                .connect(receiver)
                ["safeTransferFrom(address,address,uint256)"](receiver.address, lockDealNFT.address, poolId)
        ).not.to.be.rejected
    })
})
