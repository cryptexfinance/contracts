var expect = require("chai").expect;
var ethersProvider = require("ethers");
const bre = require("@nomiclabs/buidler");
const {formatBytes32String} = require("ethers/lib/utils");

describe("Orchestrator Contract", async function () {
	let orchestratorInstance, tcapInstance, ethVaultInstance, btcVaultInstance;
	let [owner, addr1, handler, handler2] = [];
	let accounts = [];
	let divisor = "10000000000";
	let ratio = "150";
	let burnFee = "1";
	let liquidationPenalty = "10";
	let whitelistEnabled = false;
	let tcapOracle = (tcapAddress = collateralAddress = collateralOracle = ethOracle =
		ethersProvider.constants.AddressZero);
	const THREE_DAYS = 259200;
	const TWO_DAYS = 172800;

	const fns = {
		DIVISOR: 0,
		RATIO: 1,
		BURNFEE: 2,
	};

	before("Set Accounts", async () => {
		let [acc0, acc1, acc3, acc4, acc5] = await ethers.getSigners();
		owner = acc0;
		addr1 = acc1;
		handler = acc3;
		handler2 = acc4;
		if (owner && addr1 && handler) {
			accounts.push(await owner.getAddress());
			accounts.push(await addr1.getAddress());
			accounts.push(await handler.getAddress());
			accounts.push(await handler2.getAddress());
			accounts.push(await acc5.getAddress());
		}
	});

	it("...should deploy the contract", async () => {
		const orchestrator = await ethers.getContractFactory("Orchestrator");
		orchestratorInstance = await orchestrator.deploy();
		await orchestratorInstance.deployed();
		expect(orchestratorInstance.address).properAddress;
		//Vaults
		const wethVault = await ethers.getContractFactory("VaultHandler");
		ethVaultInstance = await wethVault.deploy(orchestratorInstance.address);
		await ethVaultInstance.deployed();
		expect(ethVaultInstance.address).properAddress;
	});

	it("...should set the owner", async () => {
		const defaultOwner = await orchestratorInstance.owner();
		expect(defaultOwner).to.eq(accounts[0]);
	});

	it("...should initialize vault contracts", async () => {
		await expect(
			orchestratorInstance
				.connect(addr1)
				.initializeVault(
					ethVaultInstance.address,
					divisor,
					ratio,
					burnFee,
					liquidationPenalty,
					whitelistEnabled,
					tcapOracle,
					tcapAddress,
					collateralAddress,
					collateralOracle,
					ethOracle
				)
		).to.be.revertedWith("Ownable: caller is not the owner");

		await orchestratorInstance.initializeVault(
			ethVaultInstance.address,
			divisor,
			ratio,
			burnFee,
			liquidationPenalty,
			whitelistEnabled,
			tcapOracle,
			tcapAddress,
			collateralAddress,
			collateralOracle,
			ethOracle
		);
		expect(divisor).to.eq(await ethVaultInstance.divisor());
		expect(ratio).to.eq(await ethVaultInstance.ratio());
		expect(burnFee).to.eq(await ethVaultInstance.burnFee());
		expect(liquidationPenalty).to.eq(await ethVaultInstance.liquidationPenalty());
		expect(whitelistEnabled).to.eq(await ethVaultInstance.whitelistEnabled());
		expect(tcapOracle).to.eq(await ethVaultInstance.tcapOracle());
		expect(tcapAddress).to.eq(await ethVaultInstance.TCAPToken());
		expect(collateralAddress).to.eq(await ethVaultInstance.collateralContract());
		expect(collateralOracle).to.eq(await ethVaultInstance.collateralPriceOracle());
		expect(ethOracle).to.eq(await ethVaultInstance.ETHPriceOracle());
	});
	it("...shouldn't allow a vault to initialize more than once", async () => {
		await expect(
			orchestratorInstance.initializeVault(
				ethVaultInstance.address,
				divisor,
				ratio,
				burnFee,
				liquidationPenalty,
				whitelistEnabled,
				tcapOracle,
				tcapAddress,
				collateralAddress,
				collateralOracle,
				ethOracle
			)
		).to.be.revertedWith("Contract already initialized");
	});

	it("...shouldn't allow to initialize a non vault contract", async () => {
		await expect(
			orchestratorInstance.initializeVault(
				ethersProvider.constants.AddressZero,
				divisor,
				ratio,
				burnFee,
				liquidationPenalty,
				whitelistEnabled,
				tcapOracle,
				tcapAddress,
				collateralAddress,
				collateralOracle,
				ethOracle
			)
		).to.be.revertedWith("Not a valid vault");
	});

	it("...should allow to unlock timelock for a function", async () => {
		await expect(
			orchestratorInstance.connect(addr1).unlockVaultFunction(fns.DIVISOR)
		).to.be.revertedWith("Ownable: caller is not the owner");

		await orchestratorInstance.unlockVaultFunction(fns.DIVISOR);
		expect(await orchestratorInstance.timelock(fns.DIVISOR)).to.not.eq(0);
		expect(Date.now()).to.lte((await orchestratorInstance.timelock(fns.DIVISOR)).mul(1000));

		await expect(orchestratorInstance.setDivisor(ethVaultInstance.address, 0)).to.be.revertedWith(
			"Function is timelocked"
		);
		//fast-forward
		bre.network.provider.send("evm_increaseTime", [TWO_DAYS]);
		await expect(orchestratorInstance.setDivisor(ethVaultInstance.address, 0)).to.be.revertedWith(
			"Function is timelocked"
		); //fast-forward
		bre.network.provider.send("evm_increaseTime", [TWO_DAYS]);
		await orchestratorInstance.setDivisor(ethVaultInstance.address, divisor);
	});

	xit("...should allow to unlock timelock for all function", async () => {});

	it("...should allow to lock again a function", async () => {
		await expect(
			orchestratorInstance.connect(addr1).lockVaultFunction(fns.DIVISOR)
		).to.be.revertedWith("Ownable: caller is not the owner");

		await orchestratorInstance.lockVaultFunction(fns.DIVISOR);
		expect(await orchestratorInstance.timelock(fns.DIVISOR)).to.eq(0);
	});

	xit("...should allow to lock again all function", async () => {});

	it("...should set vault divisor", async () => {
		let divisor = "20000000000";

		await expect(orchestratorInstance.setDivisor(ethVaultInstance.address, 0)).to.be.revertedWith(
			"Function is timelocked"
		);
		await orchestratorInstance.unlockVaultFunction(fns.DIVISOR);
		//fast-forward
		bre.network.provider.send("evm_increaseTime", [THREE_DAYS]);

		await expect(
			orchestratorInstance.connect(addr1).setDivisor(ethVaultInstance.address, 0)
		).to.be.revertedWith("Ownable: caller is not the owner");

		await expect(
			orchestratorInstance.setDivisor(ethersProvider.constants.AddressZero, 0)
		).to.be.revertedWith("Not a valid vault");

		await orchestratorInstance.setDivisor(ethVaultInstance.address, divisor);
		expect(divisor).to.eq(await ethVaultInstance.divisor());
	});
});
