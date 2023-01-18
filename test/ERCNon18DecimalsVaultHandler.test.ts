import {expect} from "chai";
import {BigNumber, Contract, constants, utils, Signer} from "ethers";
import hre, {waffle} from "hardhat";
import {deployContract} from "./utils";
import {MockContract, smock} from "@defi-wonderland/smock";

// ************************************************************************************************
// NOTE
// 1.The tests in this file use two vaults, one with 18 decimals and another with less than 18.
// 2.Calculation for tokens with 18 decimals are assumed to be correct.
// 3.Different vault parameters are then compared for an equal amount of collateral deposited in USD
// 4.By checking that the calculations for both tokens are equivalent in USD, from `3` we can
//   conclude that the calculations for tokens with less than 18 decimals are correct.
// ************************************************************************************************

export async function fakeDeployContract(name: string, deployer: Signer, args: any[]) {
	const contractCls = await smock.mock(name);
	return await contractCls.connect(deployer).deploy(...args);
}

describe("ERC20 Vaults With Non 18 Decimal", async function () {
	let CTX: Contract;
	let orchestrator: Contract;
	let treasury: Contract;
	let tCAP: Contract;
	let aggregatorInterfaceTCAP: MockContract<Contract>;
	let tCAPOracle: Contract;
	let wBTC: Contract;
	let aggregatorInterfaceWBTC: MockContract<Contract>;
	let wBTCOracle: Contract;
	let DAI: Contract;
	let aggregatorInterfaceDAI: MockContract<Contract>;
	let DAIOracle: Contract;
	let aggregatorInterfaceWETH: MockContract<Contract>;
	let ETHOracle: Contract;
	let wBTCVaultHandler: Contract;
	let rewardHandlerWBTC: Contract;
	let DAIVaultHandler: Contract;
	let rewardHandlerDAI: Contract;
	let tcapOracleValue: BigNumber;
	let wBTCOracleValue: BigNumber;
	let DAIOracleValue: BigNumber;
	const [wallet, acc1, acc2, acc3, acc4] = waffle.provider.getWallets();

	beforeEach(async () => {
		const {timestamp: now} = await waffle.provider.getBlock("latest");
		CTX = await deployContract("Ctx", wallet, [wallet.address, wallet.address, now + 60 * 60]);
		orchestrator = await deployContract("Orchestrator", wallet, [wallet.address]);
		treasury = await deployContract("BaseTreasury", wallet, [wallet.address]);
		tCAP = await deployContract("TCAP", wallet, ["TCAP Token", "TCAP", 0, orchestrator.address]);
		aggregatorInterfaceTCAP = await fakeDeployContract("AggregatorInterface", wallet, []);
		tCAPOracle = await deployContract("ChainlinkOracle", wallet, [
			aggregatorInterfaceTCAP.address,
			wallet.address,
		]);
		wBTC = await deployContract("WBTC", wallet, []);
		aggregatorInterfaceWBTC = await fakeDeployContract("AggregatorInterface", wallet, []);
		wBTCOracle = await deployContract("ChainlinkOracle", wallet, [
			aggregatorInterfaceWBTC.address,
			wallet.address,
		]);
		DAI = await deployContract("DAI", wallet, []);
		aggregatorInterfaceDAI = await fakeDeployContract("AggregatorInterface", wallet, []);
		DAIOracle = await deployContract("ChainlinkOracle", wallet, [
			aggregatorInterfaceDAI.address,
			wallet.address,
		]);
		aggregatorInterfaceWETH = await fakeDeployContract("AggregatorInterface", wallet, []);
		ETHOracle = await deployContract("ChainlinkOracle", wallet, [
			aggregatorInterfaceWETH.address,
			wallet.address,
		]);
		let nonce = await wallet.getTransactionCount();
		wBTCVaultHandler = await deployContract("ERC20VaultHandler", wallet, [
			orchestrator.address,
			"10000000000",
			"150",
			"1",
            "50",
			"10",
			tCAPOracle.address,
			tCAP.address,
			wBTC.address,
			wBTCOracle.address,
			ETHOracle.address,
			treasury.address,
			0
		]);
		rewardHandlerWBTC = await deployContract("RewardHandler", wallet, [
			orchestrator.address,
			CTX.address,
			wBTCVaultHandler.address,
		]);

		nonce = await wallet.getTransactionCount();
		DAIVaultHandler = await deployContract("ERC20VaultHandler", wallet, [
			orchestrator.address,
			"10000000000",
			"150",
			"1",
            "50",
			"10",
			tCAPOracle.address,
			tCAP.address,
			DAI.address,
			DAIOracle.address,
			ETHOracle.address,
			treasury.address,
			0
		]);
		// add Vaults
		await orchestrator.addTCAPVault(tCAP.address, wBTCVaultHandler.address);
		await orchestrator.addTCAPVault(tCAP.address, DAIVaultHandler.address);

		// Mint tokens
		// 10000 * 10 ** 8
		await wBTC.mint(wallet.address, "1000000000000");
		// 10000 * 10 ** 18
		await DAI.mint(wallet.address, "10000000000000000000000");

		// Mock Price of Tcap
		tcapOracleValue = BigNumber.from("214270586778100000000");
		aggregatorInterfaceTCAP.latestRoundData.returns([
			BigNumber.from("55340232221128679816"),
			tcapOracleValue,
			1616543796,
			1616543819,
			BigNumber.from("55340232221128679816"),
		]);
		expect(await tCAPOracle.getLatestAnswer()).to.be.eq(tcapOracleValue);

		// Mock Price of wBTC
		wBTCOracleValue = BigNumber.from("4271800000000");
		aggregatorInterfaceWBTC.latestRoundData.returns([
			BigNumber.from("55340232221128679816"),
			wBTCOracleValue,
			1616543796,
			1616543819,
			BigNumber.from("55340232221128679816"),
		]);
		expect(await wBTCOracle.getLatestAnswer()).to.be.eq(wBTCOracleValue);

		// Mock Price of DAI
		DAIOracleValue = BigNumber.from("100103401");
		aggregatorInterfaceDAI.latestRoundData.returns([
			BigNumber.from("55340232221128679816"),
			DAIOracleValue,
			1616543796,
			1616543819,
			BigNumber.from("55340232221128679816"),
		]);
		expect(await DAIOracle.getLatestAnswer()).to.be.eq(DAIOracleValue);
	});

	it("...check collateralDecimalsAdjustmentFactor", async () => {
		// wBTC has 8 decimals
		// collateralDecimalsAdjustmentFactor = 10 ** (18 -8) = 10 ** 10
		expect(await wBTCVaultHandler.collateralDecimalsAdjustmentFactor()).to.be.eq(
			BigNumber.from(`${10 ** 10}`)
		);
		// DAI has 18 decimals
		// collateralDecimalsAdjustmentFactor = 10 ** (18 - 18) = 1
		expect(await DAIVaultHandler.collateralDecimalsAdjustmentFactor()).to.be.eq(
			BigNumber.from("1")
		);
	});

	it("...should have same amount of collateral in USD", async () => {
		let tcapAmount = BigNumber.from(`${2 * 10 ** 18}`);
		const wBTCCollateralRequired = await wBTCVaultHandler.requiredCollateral(tcapAmount);
		const DAICollateralRequired = await DAIVaultHandler.requiredCollateral(tcapAmount);
		let wBTCtoUSD = wBTCCollateralRequired
			.mul(wBTCOracleValue)
			.div(BigNumber.from(`${10 ** (8 + 8)}`));
		// 8 decimal places for DAI and 18 decimal places for oracle
		let DAItoUSD = DAICollateralRequired.mul(DAIOracleValue)
			.div(BigNumber.from(`${10 ** 18}`))
			.div(BigNumber.from(`${10 ** 8}`));

		// Check that the required Collateral for DAI and WBTC are equivalent in USD
		expect(wBTCtoUSD).to.be.eq(DAItoUSD);
	});

	it("...should have same Vault Ratio", async () => {
		const USDAmountCollateralToDeposit = BigNumber.from(1000);
		// equivalent in decimals places supported by WBTC
		const btcCollateralAmountDeposit = USDAmountCollateralToDeposit.mul(
			10 ** 8 // wBTC supports 8 decimals
		).div(
			wBTCOracleValue.div(10 ** 8) // oracle has 8 decimals
		);
		const DAICollateralAmountDeposit = USDAmountCollateralToDeposit.mul(
			`${10 ** 18}` // DAI supports 18 decimals
		).div(
			DAIOracleValue.div(10 ** 8) // oracle has 8 decimals
		);
		// TCAP amount to be minted by both vaults
		// A weird number is chosen in order to check the precision of the math.
		let tcapAmount = BigNumber.from("2418604651162790553");
        const mintFee = await wBTCVaultHandler.getMintFee(tcapAmount);

		await wBTCVaultHandler.createVault();
		await wBTC.approve(wBTCVaultHandler.address, btcCollateralAmountDeposit);
		await wBTCVaultHandler.addCollateral(btcCollateralAmountDeposit);
		// Mint a small amount of TCAP
		await wBTCVaultHandler.mint(tcapAmount, {value: mintFee});
		const btcVaultRatio = await wBTCVaultHandler.getVaultRatio(1);
		expect(btcVaultRatio).to.be.above(150);

		await DAI.approve(DAIVaultHandler.address, DAICollateralAmountDeposit);
		await DAIVaultHandler.createVault();
		await DAIVaultHandler.addCollateral(DAICollateralAmountDeposit);
		// Mint same amount of Tcap minted in Btc Vault
		await DAIVaultHandler.mint(tcapAmount, {value: mintFee});
		const daiVaultRatio = await DAIVaultHandler.getVaultRatio(1);
		expect(daiVaultRatio).to.be.above(150);

		// Check that the vault ratio is the same since deposited amount in USD is same and
		// The amount of TCAP minted is also the same.
		// For TCAP = 2418604651162790553, btcVaultRatio is 192 and daiVaultRatio is 193
		// The difference arises because of the integer precision of the EVM.
		// A difference of 1 is acceptable in this case.
		expect(btcVaultRatio.toNumber()).to.be.closeTo(daiVaultRatio.toNumber(), 1);
	});

	it("...should have same vault ratio after burning TCAP", async () => {
		const USDAmountCollateralToDeposit = BigNumber.from(1000);
		// equivalent in decimals places supported by WBTC
		const btcCollateralAmountDeposit = USDAmountCollateralToDeposit.mul(
			10 ** 8 // wBTC supports 8 decimals
		).div(
			wBTCOracleValue.div(10 ** 8) // oracle has 8 decimals
		);
		const DAICollateralAmountDeposit = USDAmountCollateralToDeposit.mul(
			`${10 ** 18}` // DAI supports 18 decimals
		).div(
			DAIOracleValue.div(10 ** 8) // oracle has 8 decimals
		);
		// TCAP amount to be minted by both vaults
		// A weird number is chosen in order to check the precision of the math.
		// approx 2.4 TCAP
		let tcapAmount = BigNumber.from("2418604651162790553");
        const mintFee = await wBTCVaultHandler.getMintFee(tcapAmount);
		await wBTCVaultHandler.createVault();
		await wBTC.approve(wBTCVaultHandler.address, btcCollateralAmountDeposit);
		await wBTCVaultHandler.addCollateral(btcCollateralAmountDeposit);
		// Mint a small amount of TCAP
		await wBTCVaultHandler.mint(tcapAmount, {value: mintFee});
		const oldBTCVaultRatio = await wBTCVaultHandler.getVaultRatio(1);
		expect(oldBTCVaultRatio).to.be.above(150);

		await DAI.approve(DAIVaultHandler.address, DAICollateralAmountDeposit);
		await DAIVaultHandler.createVault();
		await DAIVaultHandler.addCollateral(DAICollateralAmountDeposit);
		// Mint same amount of Tcap minted in Btc Vault
		await DAIVaultHandler.mint(tcapAmount,{value:mintFee});
		const oldDAIVaultRatio = await DAIVaultHandler.getVaultRatio(1);
		expect(oldDAIVaultRatio).to.be.above(150);
		expect(oldBTCVaultRatio.toNumber()).to.be.closeTo(oldDAIVaultRatio.toNumber(), 1);

		// approx 0.4 TCAP
		const tcapToBurn = BigNumber.from("400000000000000000");
		const burnFee = await wBTCVaultHandler.getBurnFee(tcapToBurn);
		// Make sure burn fee is same for both vaults
		expect(burnFee).to.be.eq(await wBTCVaultHandler.getBurnFee(tcapToBurn));

		await wBTCVaultHandler.burn(tcapToBurn, {value: burnFee});
		const newBTCVaultRatio = await wBTCVaultHandler.getVaultRatio(1);
		expect(newBTCVaultRatio).to.be.above(oldBTCVaultRatio);

		await DAIVaultHandler.burn(tcapToBurn, {value: burnFee});
		const newDAIVaultRatio = await DAIVaultHandler.getVaultRatio(1);
		expect(newDAIVaultRatio).to.be.above(oldDAIVaultRatio);

		expect(newBTCVaultRatio.toNumber()).to.be.closeTo(newDAIVaultRatio.toNumber(), 1);
	});

	it("...should have same vault ratio after removing collateral", async () => {
		const USDAmountCollateralToDeposit = BigNumber.from(1000);
		// equivalent in decimals places supported by WBTC
		const btcCollateralAmountDeposit = USDAmountCollateralToDeposit.mul(
			10 ** 8 // wBTC supports 8 decimals
		).div(
			wBTCOracleValue.div(10 ** 8) // oracle has 8 decimals
		);
		const DAICollateralAmountDeposit = USDAmountCollateralToDeposit.mul(
			`${10 ** 18}` // DAI supports 18 decimals
		).div(
			DAIOracleValue.div(10 ** 8) // oracle has 8 decimals
		);
		// TCAP amount to be minted by both vaults
		// A weird number is chosen in order to check the precision of the math.
		// approx 2.4 TCAP
		let tcapAmount = BigNumber.from("2418604651162790553");
        const mintFee = await wBTCVaultHandler.getMintFee(tcapAmount);
		await wBTCVaultHandler.createVault();
		await wBTC.approve(wBTCVaultHandler.address, btcCollateralAmountDeposit);
		await wBTCVaultHandler.addCollateral(btcCollateralAmountDeposit);
		// Mint a small amount of TCAP
		await wBTCVaultHandler.mint(tcapAmount,{value:mintFee});
		const oldBTCVaultRatio = await wBTCVaultHandler.getVaultRatio(1);
		expect(oldBTCVaultRatio).to.be.above(150);

		await DAI.approve(DAIVaultHandler.address, DAICollateralAmountDeposit);
		await DAIVaultHandler.createVault();
		await DAIVaultHandler.addCollateral(DAICollateralAmountDeposit);
		// Mint same amount of Tcap minted in Btc Vault
		await DAIVaultHandler.mint(tcapAmount,{value:mintFee});
		const oldDAIVaultRatio = await DAIVaultHandler.getVaultRatio(1);
		expect(oldDAIVaultRatio).to.be.above(150);
		expect(oldBTCVaultRatio.toNumber()).to.be.closeTo(oldDAIVaultRatio.toNumber(), 1);

		// 53 USD
		const usdAmountToWithdraw = BigNumber.from(53);
		const btcCollateralAmountWithdraw = usdAmountToWithdraw
			.mul(
				10 ** 8 // wBTC supports 8 decimals
			)
			.div(
				wBTCOracleValue.div(10 ** 8) // oracle has 8 decimals
			);
		const DAICollateralAmountWithdraw = usdAmountToWithdraw
			.mul(
				`${10 ** 18}` // DAI supports 18 decimals
			)
			.div(
				DAIOracleValue.div(10 ** 8) // oracle has 8 decimals
			);

		await wBTCVaultHandler.removeCollateral(btcCollateralAmountWithdraw);
		const newBTCVaultRatio = await wBTCVaultHandler.getVaultRatio(1);
		expect(newBTCVaultRatio).to.be.below(oldBTCVaultRatio);

		await DAIVaultHandler.removeCollateral(DAICollateralAmountWithdraw);
		const newDAIVaultRatio = await DAIVaultHandler.getVaultRatio(1);
		expect(newDAIVaultRatio).to.be.below(oldDAIVaultRatio);

		expect(newBTCVaultRatio.toNumber()).to.be.closeTo(newDAIVaultRatio.toNumber(), 1);
	});

	it("...should have same vault ratio when vault ratio goes down", async () => {
		const USDAmountCollateralToDeposit = BigNumber.from(1000);
		// equivalent in decimals places supported by WBTC
		const btcCollateralAmountDeposit = USDAmountCollateralToDeposit.mul(
			10 ** 8 // wBTC supports 8 decimals
		).div(
			wBTCOracleValue.div(10 ** 8) // oracle has 8 decimals
		);
		const DAICollateralAmountDeposit = USDAmountCollateralToDeposit.mul(
			`${10 ** 18}` // DAI supports 18 decimals
		).div(
			DAIOracleValue.div(10 ** 8) // oracle has 8 decimals
		);
		// TCAP amount to be minted by both vaults
		// A weird number is chosen in order to check the precision of the math.
		// approx 2.4 TCAP
		let tcapAmount = BigNumber.from("2418604651162790553");
        const mintFee = await wBTCVaultHandler.getMintFee(tcapAmount);
		await wBTCVaultHandler.createVault();
		await wBTC.approve(wBTCVaultHandler.address, btcCollateralAmountDeposit);
		await wBTCVaultHandler.addCollateral(btcCollateralAmountDeposit);
		// Mint a small amount of TCAP
		await wBTCVaultHandler.mint(tcapAmount,{value:mintFee});
		const oldBTCVaultRatio = await wBTCVaultHandler.getVaultRatio(1);
		expect(oldBTCVaultRatio).to.be.above(150);

		await DAI.approve(DAIVaultHandler.address, DAICollateralAmountDeposit);
		await DAIVaultHandler.createVault();
		await DAIVaultHandler.addCollateral(DAICollateralAmountDeposit);
		// Mint same amount of Tcap minted in Btc Vault
		await DAIVaultHandler.mint(tcapAmount,{value:mintFee});
		const oldDAIVaultRatio = await DAIVaultHandler.getVaultRatio(1);
		expect(oldDAIVaultRatio).to.be.above(150);
		expect(oldBTCVaultRatio.toNumber()).to.be.closeTo(oldDAIVaultRatio.toNumber(), 1);

		// Simulate Oracle price change
		// reduce price by 30%, mul(70).div(100) -> 70%
		const newWBTCOracleValue = wBTCOracleValue.mul(70).div(100);
		aggregatorInterfaceWBTC.latestRoundData.returns([
			BigNumber.from("55340232221128679816"),
			newWBTCOracleValue,
			1616543796,
			1616543819,
			BigNumber.from("55340232221128679816"),
		]);
		expect(await wBTCOracle.getLatestAnswer()).to.be.eq(newWBTCOracleValue);

		const newDAIOracleValue = DAIOracleValue.mul(70).div(100);
		aggregatorInterfaceDAI.latestRoundData.returns([
			BigNumber.from("55340232221128679816"),
			newDAIOracleValue,
			1616543796,
			1616543819,
			BigNumber.from("55340232221128679816"),
		]);
		expect(await DAIOracle.getLatestAnswer()).to.be.eq(newDAIOracleValue);
		const newBTCVaultRatio = await wBTCVaultHandler.getVaultRatio(1);
		expect(newBTCVaultRatio).to.be.below(150);
		const newDAIVaultRatio = await DAIVaultHandler.getVaultRatio(1);
		expect(newDAIVaultRatio).to.be.below(150);

		expect(newBTCVaultRatio.toNumber()).to.be.closeTo(newDAIVaultRatio.toNumber(), 1);
	});

	it("...should have same requiredLiquidationTCAP when vault ratio goes down", async () => {
		const USDAmountCollateralToDeposit = BigNumber.from(1000);
		// equivalent in decimals places supported by WBTC
		const btcCollateralAmountDeposit = USDAmountCollateralToDeposit.mul(
			10 ** 8 // wBTC supports 8 decimals
		).div(
			wBTCOracleValue.div(10 ** 8) // oracle has 8 decimals
		);
		const DAICollateralAmountDeposit = USDAmountCollateralToDeposit.mul(
			`${10 ** 18}` // DAI supports 18 decimals
		).div(
			DAIOracleValue.div(10 ** 8) // oracle has 8 decimals
		);
		// TCAP amount to be minted by both vaults
		// A weird number is chosen in order to check the precision of the math.
		// approx 2.4 TCAP
		let tcapAmount = BigNumber.from("2418604651162790553");
        const mintFee = await wBTCVaultHandler.getMintFee(tcapAmount);
		await wBTCVaultHandler.createVault();
		await wBTC.approve(wBTCVaultHandler.address, btcCollateralAmountDeposit);
		await wBTCVaultHandler.addCollateral(btcCollateralAmountDeposit);
		// Mint a small amount of TCAP
		await wBTCVaultHandler.mint(tcapAmount,{value:mintFee});
		const oldBTCVaultRatio = await wBTCVaultHandler.getVaultRatio(1);
		expect(oldBTCVaultRatio).to.be.above(150);

		await DAI.approve(DAIVaultHandler.address, DAICollateralAmountDeposit);
		await DAIVaultHandler.createVault();
		await DAIVaultHandler.addCollateral(DAICollateralAmountDeposit);
		// Mint same amount of Tcap minted in Btc Vault
		await DAIVaultHandler.mint(tcapAmount,{value:mintFee});
		const oldDAIVaultRatio = await DAIVaultHandler.getVaultRatio(1);
		expect(oldDAIVaultRatio).to.be.above(150);
		expect(oldBTCVaultRatio.toNumber()).to.be.closeTo(oldDAIVaultRatio.toNumber(), 1);

		// Simulate Oracle price change
		// reduce price by 30%, mul(70).div(100) -> 70%
		const newWBTCOracleValue = wBTCOracleValue.mul(70).div(100);
		aggregatorInterfaceWBTC.latestRoundData.returns([
			BigNumber.from("55340232221128679816"),
			newWBTCOracleValue,
			1616543796,
			1616543819,
			BigNumber.from("55340232221128679816"),
		]);
		expect(await wBTCOracle.getLatestAnswer()).to.be.eq(newWBTCOracleValue);

		const newDAIOracleValue = DAIOracleValue.mul(70).div(100);
		aggregatorInterfaceDAI.latestRoundData.returns([
			BigNumber.from("55340232221128679816"),
			newDAIOracleValue,
			1616543796,
			1616543819,
			BigNumber.from("55340232221128679816"),
		]);
		expect(await DAIOracle.getLatestAnswer()).to.be.eq(newDAIOracleValue);
		const newBTCVaultRatio = await wBTCVaultHandler.getVaultRatio(1);
		expect(newBTCVaultRatio).to.be.below(150);
		const newDAIVaultRatio = await DAIVaultHandler.getVaultRatio(1);
		expect(newDAIVaultRatio).to.be.below(150);
		expect(newBTCVaultRatio.toNumber()).to.be.eq(newDAIVaultRatio.toNumber());

		const BTCTcapLiquidationAmount = await wBTCVaultHandler.requiredLiquidationTCAP(1);
		const DAITcapLiquidationAmount = await DAIVaultHandler.requiredLiquidationTCAP(1);

		expect(BTCTcapLiquidationAmount.toHexString() / 10 ** 18).to.be.closeTo(
			DAITcapLiquidationAmount.toHexString() / 10 ** 18,
			0.01
		);
	});

	it("...should have same liquidationReward when vault ratio goes down", async () => {
		const USDAmountCollateralToDeposit = BigNumber.from(1000);
		// equivalent in decimals places supported by WBTC
		const btcCollateralAmountDeposit = USDAmountCollateralToDeposit.mul(
			10 ** 8 // wBTC supports 8 decimals
		).div(
			wBTCOracleValue.div(10 ** 8) // oracle has 8 decimals
		);
		const DAICollateralAmountDeposit = USDAmountCollateralToDeposit.mul(
			`${10 ** 18}` // DAI supports 18 decimals
		).div(
			DAIOracleValue.div(10 ** 8) // oracle has 8 decimals
		);
		// TCAP amount to be minted by both vaults
		// A weird number is chosen in order to check the precision of the math.
		// approx 2.4 TCAP
		let tcapAmount = BigNumber.from("2418604651162790553");
        const mintFee = await wBTCVaultHandler.getMintFee(tcapAmount);
		await wBTCVaultHandler.createVault();
		await wBTC.approve(wBTCVaultHandler.address, btcCollateralAmountDeposit);
		await wBTCVaultHandler.addCollateral(btcCollateralAmountDeposit);
		// Mint a small amount of TCAP
		await wBTCVaultHandler.mint(tcapAmount,{value:mintFee});
		const oldBTCVaultRatio = await wBTCVaultHandler.getVaultRatio(1);
		expect(oldBTCVaultRatio).to.be.above(150);

		await DAI.approve(DAIVaultHandler.address, DAICollateralAmountDeposit);
		await DAIVaultHandler.createVault();
		await DAIVaultHandler.addCollateral(DAICollateralAmountDeposit);
		// Mint same amount of Tcap minted in Btc Vault
		await DAIVaultHandler.mint(tcapAmount,{value:mintFee});
		const oldDAIVaultRatio = await DAIVaultHandler.getVaultRatio(1);
		expect(oldDAIVaultRatio).to.be.above(150);
		expect(oldBTCVaultRatio.toNumber()).to.be.closeTo(oldDAIVaultRatio.toNumber(), 1);

		// Simulate Oracle price change
		// reduce price by 30%, mul(70).div(100) -> 70%
		const newWBTCOracleValue = wBTCOracleValue.mul(70).div(100);
		aggregatorInterfaceWBTC.latestRoundData.returns([
			BigNumber.from("55340232221128679816"),
			newWBTCOracleValue,
			1616543796,
			1616543819,
			BigNumber.from("55340232221128679816"),
		]);
		expect(await wBTCOracle.getLatestAnswer()).to.be.eq(newWBTCOracleValue);

		const newDAIOracleValue = DAIOracleValue.mul(70).div(100);
		aggregatorInterfaceDAI.latestRoundData.returns([
			BigNumber.from("55340232221128679816"),
			newDAIOracleValue,
			1616543796,
			1616543819,
			BigNumber.from("55340232221128679816"),
		]);
		expect(await DAIOracle.getLatestAnswer()).to.be.eq(newDAIOracleValue);
		const newBTCVaultRatio = await wBTCVaultHandler.getVaultRatio(1);
		expect(newBTCVaultRatio).to.be.below(150);
		const newDAIVaultRatio = await DAIVaultHandler.getVaultRatio(1);
		expect(newDAIVaultRatio).to.be.below(150);
		expect(newBTCVaultRatio.toNumber()).to.be.eq(newDAIVaultRatio.toNumber());

		const BTCLiquidationReward = await wBTCVaultHandler.liquidationReward(1);
		const DAILiquidationReward = await DAIVaultHandler.liquidationReward(1);
		const BTCRewardInUSD = newWBTCOracleValue
			.mul(BTCLiquidationReward)
			.div(BigNumber.from(`${10 ** 8}`))
			.div(BigNumber.from(`${10 ** 8}`));
		const DAIRewardInUSD = newDAIOracleValue
			.mul(DAILiquidationReward)
			.div(BigNumber.from(`${10 ** 8}`))
			.div(BigNumber.from(`${10 ** 18}`));
		expect(BTCRewardInUSD.toNumber()).to.be.closeTo(DAIRewardInUSD.toNumber(), 2);
	});

	it("...should have same vault ratio after liquidating vault", async () => {
		const USDAmountCollateralToDeposit = BigNumber.from(1000);
		// equivalent in decimals places supported by WBTC
		const btcCollateralAmountDeposit = USDAmountCollateralToDeposit.mul(
			10 ** 8 // wBTC supports 8 decimals
		).div(
			wBTCOracleValue.div(10 ** 8) // oracle has 8 decimals
		);
		const DAICollateralAmountDeposit = USDAmountCollateralToDeposit.mul(
			`${10 ** 18}` // DAI supports 18 decimals
		).div(
			DAIOracleValue.div(10 ** 8) // oracle has 8 decimals
		);
		// TCAP amount to be minted by both vaults
		// A weird number is chosen in order to check the precision of the math.
		// approx 2.4 TCAP
		let tcapAmount = BigNumber.from("2418604651162790553");
        const mintFee = await wBTCVaultHandler.getMintFee(tcapAmount);
		await wBTCVaultHandler.createVault();
		await wBTC.approve(wBTCVaultHandler.address, btcCollateralAmountDeposit);
		await wBTCVaultHandler.addCollateral(btcCollateralAmountDeposit);
		// Mint a small amount of TCAP
		await wBTCVaultHandler.mint(tcapAmount,{value:mintFee});
		const oldBTCVaultRatio = await wBTCVaultHandler.getVaultRatio(1);
		expect(oldBTCVaultRatio).to.be.above(150);

		await DAI.approve(DAIVaultHandler.address, DAICollateralAmountDeposit);
		await DAIVaultHandler.createVault();
		await DAIVaultHandler.addCollateral(DAICollateralAmountDeposit);
		// Mint same amount of Tcap minted in Btc Vault
		await DAIVaultHandler.mint(tcapAmount,{value:mintFee});
		const oldDAIVaultRatio = await DAIVaultHandler.getVaultRatio(1);
		expect(oldDAIVaultRatio).to.be.above(150);
		expect(oldBTCVaultRatio.toNumber()).to.be.closeTo(oldDAIVaultRatio.toNumber(), 1);

		// Simulate Oracle price change
		// reduce price by 30%, mul(70).div(100) -> 70%
		const newWBTCOracleValue = wBTCOracleValue.mul(70).div(100);
		aggregatorInterfaceWBTC.latestRoundData.returns([
			BigNumber.from("55340232221128679816"),
			newWBTCOracleValue,
			1616543796,
			1616543819,
			BigNumber.from("55340232221128679816"),
		]);
		expect(await wBTCOracle.getLatestAnswer()).to.be.eq(newWBTCOracleValue);

		const newDAIOracleValue = DAIOracleValue.mul(70).div(100);
		aggregatorInterfaceDAI.latestRoundData.returns([
			BigNumber.from("55340232221128679816"),
			newDAIOracleValue,
			1616543796,
			1616543819,
			BigNumber.from("55340232221128679816"),
		]);
		expect(await DAIOracle.getLatestAnswer()).to.be.eq(newDAIOracleValue);
		const newBTCVaultRatio = await wBTCVaultHandler.getVaultRatio(1);
		expect(newBTCVaultRatio).to.be.below(150);
		const newDAIVaultRatio = await DAIVaultHandler.getVaultRatio(1);
		expect(newDAIVaultRatio).to.be.below(150);
		expect(newBTCVaultRatio.toNumber()).to.be.eq(newDAIVaultRatio.toNumber());

		const BTCTcapLiquidationAmount = await wBTCVaultHandler.requiredLiquidationTCAP(1);
		const DAITcapLiquidationAmount = await DAIVaultHandler.requiredLiquidationTCAP(1);

		expect(BTCTcapLiquidationAmount.toHexString() / 10 ** 18).to.be.closeTo(
			DAITcapLiquidationAmount.toHexString() / 10 ** 18,
			0.01
		);

		const BTCBurnFee = await wBTCVaultHandler.getBurnFee(BTCTcapLiquidationAmount);
		const DAIBurnFee = await DAIVaultHandler.getBurnFee(DAITcapLiquidationAmount);
		await wBTCVaultHandler.liquidateVault(1, BTCTcapLiquidationAmount, {value: BTCBurnFee});
		await DAIVaultHandler.liquidateVault(1, DAITcapLiquidationAmount, {value: DAIBurnFee});
		expect(await wBTCVaultHandler.getVaultRatio(1)).to.be.eq(
			await DAIVaultHandler.getVaultRatio(1)
		);
	});

	it("...should be able to liquidate when vault ratio falls below 100", async () => {
		const USDAmountCollateralToDeposit = BigNumber.from(1000);
		// equivalent in decimals places supported by WBTC
		const btcCollateralAmountDeposit = USDAmountCollateralToDeposit.mul(
			10 ** 8 // wBTC supports 8 decimals
		).div(
			wBTCOracleValue.div(10 ** 8) // oracle has 8 decimals
		);
		// TCAP amount to be minted
		let tcapAmount = BigNumber.from("2418604651162790553");
        const mintFee = await wBTCVaultHandler.getMintFee(tcapAmount);
		await wBTCVaultHandler.createVault();
		await wBTC.approve(wBTCVaultHandler.address, btcCollateralAmountDeposit);
		await wBTCVaultHandler.addCollateral(btcCollateralAmountDeposit);
		// Mint a small amount of TCAP
		await wBTCVaultHandler.mint(tcapAmount,{value:mintFee});
		const oldBTCVaultRatio = await wBTCVaultHandler.getVaultRatio(1);
		expect(oldBTCVaultRatio).to.be.above(150);

		// Simulate Oracle price change
		// reduce price by 30%, mul(10).div(100) -> 10%
		const newWBTCOracleValue = wBTCOracleValue.mul(10).div(100);
		aggregatorInterfaceWBTC.latestRoundData.returns([
			BigNumber.from("55340232221128679816"),
			newWBTCOracleValue,
			1616543796,
			1616543819,
			BigNumber.from("55340232221128679816"),
		]);
		expect(await wBTCOracle.getLatestAnswer()).to.be.eq(newWBTCOracleValue);

		const newBTCVaultRatio = await wBTCVaultHandler.getVaultRatio(1);
		expect(newBTCVaultRatio).to.be.below(100);

		const BTCTcapLiquidationAmount = await wBTCVaultHandler.requiredLiquidationTCAP(1);

		const BTCBurnFee = await wBTCVaultHandler.getBurnFee(BTCTcapLiquidationAmount);
		await wBTCVaultHandler.liquidateVault(1, BTCTcapLiquidationAmount, {value: BTCBurnFee});

		const BTCVaultRatioAfterLiquidation = await wBTCVaultHandler.getVaultRatio(1);
		expect(BTCVaultRatioAfterLiquidation).to.be.eq(0);
		const BTCVault = await wBTCVaultHandler.vaults(1);
		expect(BTCVault.Collateral).to.be.eq(0);
		expect(BTCVault.Debt).to.be.eq(0);
	});

	it("...should be able to burn TCAP when vault ratio falls below 100", async () => {
		const USDAmountCollateralToDeposit = BigNumber.from(1000);
		// equivalent in decimals places supported by WBTC
		const btcCollateralAmountDeposit = USDAmountCollateralToDeposit.mul(
			10 ** 8 // wBTC supports 8 decimals
		).div(
			wBTCOracleValue.div(10 ** 8) // oracle has 8 decimals
		);
		// TCAP amount to be minted
		let tcapAmount = BigNumber.from("2418604651162790553");
        const mintFee = await wBTCVaultHandler.getMintFee(tcapAmount);
		await wBTCVaultHandler.createVault();
		await wBTC.approve(wBTCVaultHandler.address, btcCollateralAmountDeposit);
		await wBTCVaultHandler.addCollateral(btcCollateralAmountDeposit);
		// Mint a small amount of TCAP
		await wBTCVaultHandler.mint(tcapAmount,{value:mintFee});
		const oldBTCVaultRatio = await wBTCVaultHandler.getVaultRatio(1);
		expect(oldBTCVaultRatio).to.be.above(150);

		// Simulate Oracle price change
		// reduce price by 30%, mul(10).div(100) -> 10%
		const newWBTCOracleValue = wBTCOracleValue.mul(10).div(100);
		aggregatorInterfaceWBTC.latestRoundData.returns([
			BigNumber.from("55340232221128679816"),
			newWBTCOracleValue,
			1616543796,
			1616543819,
			BigNumber.from("55340232221128679816"),
		]);
		expect(await wBTCOracle.getLatestAnswer()).to.be.eq(newWBTCOracleValue);

		const newBTCVaultRatio = await wBTCVaultHandler.getVaultRatio(1);
		expect(newBTCVaultRatio).to.be.below(100);

		const BTCTcapBurnAmount = BigNumber.from("1000000000000000000"); // 1 TCAP
		const BTCBurnFee = await wBTCVaultHandler.getBurnFee(BTCTcapBurnAmount);
		const vaultRatioBeforeBurning = await wBTCVaultHandler.getVaultRatio(1);
		await wBTCVaultHandler.burn(BTCTcapBurnAmount, {value: BTCBurnFee});
		const vaultRatioAfterBurning = await wBTCVaultHandler.getVaultRatio(1);
		expect(vaultRatioAfterBurning).to.be.above(vaultRatioBeforeBurning);
	});
});
