import { ERC20Token, MockVaultManager, RefundTimeOverride, MockFirewall } from "../typechain-types"
import { CollateralProvider, RefundProvider } from "../typechain-types"
import { LockDealNFT } from "../typechain-types"
import { LockDealProvider, DealProvider } from "../typechain-types"
import { time, mine, takeSnapshot, SnapshotRestorer } from "@nomicfoundation/hardhat-network-helpers"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { deployed } from "@poolzfinance/poolz-helper-v2"
import { expect } from "chai"
import { ethers } from "hardhat"
import { BigNumber } from "ethers"

describe("RefundTimeOverride tests", function () {
    const functionSelector = "0xa2107de6" // bytes4(keccak256("handleRefund(uint256,address,uint256)"))
    let lockProvider: LockDealProvider
    let collateralProvider: CollateralProvider
    let refundProvider: RefundProvider
    let lockDealNFT: LockDealNFT
    let refundTimeOverride: RefundTimeOverride
    let token: ERC20Token
    let firewall: MockFirewall
    let stableCoin: ERC20Token
    let mockVaultManager: MockVaultManager
    let poolId: number
    let receiver: SignerWithAddress
    let addresses: string[]
    let snapShot: SnapshotRestorer
    let collateralPoolId: number
    let params: [BigNumber, number, BigNumber, number]
    const tokenAmount = ethers.utils.parseEther("1000000")
    const mainCoinAmount = ethers.utils.parseEther("200000")
    const MAX_RATIO = ethers.utils.parseUnits("1", 21)
    const signature: Uint8Array = ethers.utils.toUtf8Bytes("signature")
    const validTimeStamp = 1735686061
    let startTime: number,
        finishTime: number = validTimeStamp
    const ONE_DAY = 86400

    before(async () => {
        [receiver] = await ethers.getSigners()
        token = (await deployed("ERC20Token", "TOKEN")) as ERC20Token
        stableCoin = (await deployed("ERC20Token", "USDT")) as ERC20Token
        mockVaultManager = (await deployed("MockVaultManager")) as MockVaultManager
        lockDealNFT = (await deployed("LockDealNFT", mockVaultManager.address, "")) as LockDealNFT
        const dealProvider = (await deployed("DealProvider", lockDealNFT.address)) as DealProvider
        lockProvider = (await deployed(
            "LockDealProvider",
            lockDealNFT.address,
            dealProvider.address
        )) as LockDealProvider
        collateralProvider = await deployed("CollateralProvider", lockDealNFT.address, dealProvider.address)
        refundProvider = await deployed("RefundProvider", lockDealNFT.address, collateralProvider.address)
        await lockDealNFT.setApprovedContract(dealProvider.address, true)
        await lockDealNFT.setApprovedContract(lockProvider.address, true)
        await lockDealNFT.setApprovedContract(collateralProvider.address, true)
        await lockDealNFT.setApprovedContract(refundProvider.address, true)
        await token.approve(mockVaultManager.address, MAX_RATIO.mul(10))
        await mockVaultManager.setLockTimeOverride(true)
        snapShot = await takeSnapshot()
    })

    beforeEach(async () => {
        startTime = (await time.latest()) + ONE_DAY // plus 1 day
        const invalidFinishTime = finishTime + ONE_DAY * 3 // plus 3 days
        params = [tokenAmount, startTime, mainCoinAmount, invalidFinishTime]
        addresses = [receiver.address, token.address, stableCoin.address, lockProvider.address]
        poolId = (await lockDealNFT.totalSupply()).toNumber()
        collateralPoolId = poolId + 2
        await refundProvider.createNewRefundPool(addresses, params, signature, signature)
        refundTimeOverride = (await deployed(
            "RefundTimeOverride",
            lockDealNFT.address,
            validTimeStamp.toString(),
            collateralPoolId.toString()
        )) as RefundTimeOverride
        firewall = (await deployed("MockFirewall", refundTimeOverride.address)) as MockFirewall
        await collateralProvider.setFirewall(firewall.address)
    })

    afterEach(async () => {
        await snapShot.restore()
    })

    it("should set firewall", async () => {
        const tx = await collateralProvider.setFirewall(firewall.address)
        await tx.wait()
        const event = await collateralProvider.queryFilter(collateralProvider.filters.FirewallUpdated())
        const data = event[event.length - 1].args
        expect(data.newFirewall).to.equal(firewall.address)
    })

    it("should refund tokens before valid time", async () => {
        await time.setNextBlockTimestamp(validTimeStamp - 1)
        const balanceBefore = await lockDealNFT["balanceOf(address)"](refundProvider.address)
        await lockDealNFT["safeTransferFrom(address,address,uint256)"](receiver.address, refundProvider.address, poolId)
        expect(await lockDealNFT["balanceOf(address)"](refundProvider.address)).to.equal(balanceBefore.add(1))
    })

    it("should revert refund tokens after valid time", async () => {
        await time.setNextBlockTimestamp(validTimeStamp + 1)
        await expect(
            lockDealNFT["safeTransferFrom(address,address,uint256)"](receiver.address, refundProvider.address, poolId)
        ).to.be.revertedWithCustomError(refundTimeOverride, "InvalidTime")
    })

    it("should revert empty LockDealNFT address", async () => {
        await expect(
            deployed(
                "RefundTimeOverride",
                ethers.constants.AddressZero,
                validTimeStamp.toString(),
                collateralPoolId.toString()
            )
        ).to.be.revertedWithCustomError(refundTimeOverride, "ZeroAddress")
    })

    it("should revert zero collateral pool id", async () => {
        await expect(
            deployed("RefundTimeOverride", lockDealNFT.address, validTimeStamp.toString(), "0")
        ).to.be.revertedWithCustomError(refundTimeOverride, "ZeroPoolId")
    })

    it("should revert past time", async () => {
        await expect(
            deployed(
                "RefundTimeOverride",
                lockDealNFT.address,
                (await time.latest() - 100).toString(),
                collateralPoolId.toString()
            )
        ).to.be.revertedWithCustomError(refundTimeOverride, "InvalidTime")
    })
})
