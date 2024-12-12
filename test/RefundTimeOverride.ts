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
    let params: [BigNumber, number, number, BigNumber, number]
    const tokenAmount = ethers.utils.parseEther("1000000")
    const mainCoinAmount = ethers.utils.parseEther("200000")
    const MAX_RATIO = ethers.utils.parseUnits("1", 21)
    const signature: Uint8Array = ethers.utils.toUtf8Bytes("signature")
    let startTime: number, finishTime: number
    const validTimeStamp = 1735686061
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
        finishTime = startTime + 7 * ONE_DAY // plus 7 days from `startTime`
        params = [tokenAmount, startTime, finishTime, mainCoinAmount, finishTime]
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
})
