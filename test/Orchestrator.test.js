var expect = require("chai").expect;
var ethersProvider = require("ethers");
const bre = require("@nomiclabs/buidler");

describe("Orchestrator Contract", async function () {
	let orchestratorInstance, tcapInstance, tcapInstance2, ethVaultInstance, btcVaultInstance;
	let [owner, addr1, handler, handler2] = [];
	let accounts = [];
	let divisor = "10000000000";
	let ratio = "150";
	let burnFee = "1";
	let liquidationPenalty = "10";
	let tcapOracle = (collateralAddress = collateralOracle = ethOracle =
		ethersProvider.constants.AddressZero);
	const THREE_DAYS = 259200;
	const TWO_DAYS = 172800;

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
	//TODO: print logs on sets

	it("...should deploy the contract", async () => {
		const orchestrator = await ethers.getContractFactory("Orchestrator");
		orchestratorInstance = await orchestrator.deploy();
		await orchestratorInstance.deployed();
		expect(orchestratorInstance.address).properAddress;

		//TCAP
		const TCAP = await ethers.getContractFactory("TCAP");
		tcapInstance = await TCAP.deploy(
			"Total Market Cap Token",
			"TCAP",
			18,
			orchestratorInstance.address
		);
		await tcapInstance.deployed();
		tcapInstance2 = await TCAP.deploy(
			"Total Market Cap Token",
			"TCAP2",
			18,
			orchestratorInstance.address
		);
		await tcapInstance2.deployed();
		//Chainlink Oracles
		const aggregator = await ethers.getContractFactory("AggregatorInterface");
		let aggregatorInstance = await aggregator.deploy();
		const oracle = await ethers.getContractFactory("ChainlinkOracle");
		let chainlinkInstance = await oracle.deploy(aggregatorInstance.address);
		await chainlinkInstance.deployed();
		tcapOracle = chainlinkInstance.address;
		chainlinkInstance = await oracle.deploy(aggregatorInstance.address);
		await chainlinkInstance.deployed();
		collateralOracle = chainlinkInstance.address;
		chainlinkInstance = await oracle.deploy(aggregatorInstance.address);
		await chainlinkInstance.deployed();
		ethOracle = chainlinkInstance.address;
		//Collateral
		const weth = await ethers.getContractFactory("WETH");
		let wethTokenInstance = await weth.deploy();
		collateralAddress = wethTokenInstance.address;

		//Vaults
		const wethVault = await ethers.getContractFactory("ERC20VaultHandler");
		ethVaultInstance = await wethVault.deploy(
			orchestratorInstance.address,
			divisor,
			ratio,
			burnFee,
			liquidationPenalty,
			tcapOracle,
			tcapInstance.address,
			collateralAddress,
			collateralOracle,
			ethOracle
		);
		await ethVaultInstance.deployed();
		expect(ethVaultInstance.address).properAddress;

		btcVaultInstance = await wethVault.deploy(
			orchestratorInstance.address,
			divisor,
			ratio,
			burnFee,
			liquidationPenalty,
			tcapOracle,
			tcapInstance.address,
			collateralAddress,
			collateralOracle,
			ethOracle
		);
		await btcVaultInstance.deployed();
		expect(btcVaultInstance.address).properAddress;
	});

	it("...should set the owner", async () => {
		const defaultOwner = await orchestratorInstance.owner();
		expect(defaultOwner).to.eq(accounts[0]);
	});

	it("...should set vault ratio", async () => {
		let ratio = "190";

		await expect(
			orchestratorInstance.connect(addr1).setRatio(ethVaultInstance.address, 0)
		).to.be.revertedWith("Ownable: caller is not the owner");

		await expect(
			orchestratorInstance.setRatio(ethersProvider.constants.AddressZero, 0)
		).to.be.revertedWith("Not a valid vault");

		await orchestratorInstance.setRatio(ethVaultInstance.address, ratio);
		expect(ratio).to.eq(await ethVaultInstance.ratio());
	});

	it("...should set vault burn fee", async () => {
		let burnFee = "2";

		await expect(
			orchestratorInstance.connect(addr1).setBurnFee(ethVaultInstance.address, 0)
		).to.be.revertedWith("Ownable: caller is not the owner");

		await expect(
			orchestratorInstance.setBurnFee(ethersProvider.constants.AddressZero, 0)
		).to.be.revertedWith("Not a valid vault");

		await orchestratorInstance.setBurnFee(ethVaultInstance.address, burnFee);
		expect(burnFee).to.eq(await ethVaultInstance.burnFee());
	});

	it("...should set vault liquidation penalty", async () => {
		let liquidationPenalty = "15";

		await expect(
			orchestratorInstance.connect(addr1).setLiquidationPenalty(ethVaultInstance.address, 0)
		).to.be.revertedWith("Ownable: caller is not the owner");

		await expect(
			orchestratorInstance.setLiquidationPenalty(ethersProvider.constants.AddressZero, 0)
		).to.be.revertedWith("Not a valid vault");

		await orchestratorInstance.setLiquidationPenalty(ethVaultInstance.address, liquidationPenalty);
		expect(liquidationPenalty).to.eq(await ethVaultInstance.liquidationPenalty());
	});

	it("...should prevent liquidation penalty + 100 to be above ratio", async () => {
		let liquidationPenalty = "90";

		await expect(
			orchestratorInstance.setLiquidationPenalty(ethVaultInstance.address, liquidationPenalty)
		).to.be.revertedWith("VaultHandler::setLiquidationPenalty: liquidation penalty too high");
	});

	it("...should pause the Vault", async () => {
		await expect(
			orchestratorInstance.connect(addr1).pauseVault(ethVaultInstance.address)
		).to.be.revertedWith("Ownable: caller is not the owner");

		await expect(
			orchestratorInstance.pauseVault(ethersProvider.constants.AddressZero)
		).to.be.revertedWith("Not a valid vault");

		await orchestratorInstance.pauseVault(ethVaultInstance.address);
		expect(true).to.eq(await ethVaultInstance.paused());
	});

	it("...should unpause the vault", async () => {
		await expect(
			orchestratorInstance.connect(addr1).unpauseVault(ethVaultInstance.address)
		).to.be.revertedWith("Ownable: caller is not the owner");

		await expect(
			orchestratorInstance.unpauseVault(ethersProvider.constants.AddressZero)
		).to.be.revertedWith("Not a valid vault");

		await orchestratorInstance.unpauseVault(ethVaultInstance.address);
		expect(false).to.eq(await ethVaultInstance.paused());
	});

	it("...should set the liquidation penalty to 0 on emergency", async () => {
		await expect(
			orchestratorInstance.connect(addr1).setEmergencyLiquidationPenalty(ethVaultInstance.address)
		).to.be.revertedWith("Ownable: caller is not the owner");
		await expect(
			orchestratorInstance.setEmergencyLiquidationPenalty(ethersProvider.constants.AddressZero)
		).to.be.revertedWith("Not a valid vault");
		await orchestratorInstance.setEmergencyLiquidationPenalty(ethVaultInstance.address);
		expect(await ethVaultInstance.liquidationPenalty()).to.eq(0);
	});

	it("...should set the burn fee to 0 on emergency", async () => {
		await expect(
			orchestratorInstance.connect(addr1).setEmergencyBurnFee(ethVaultInstance.address)
		).to.be.revertedWith("Ownable: caller is not the owner");
		await expect(
			orchestratorInstance.setEmergencyBurnFee(ethersProvider.constants.AddressZero)
		).to.be.revertedWith("Not a valid vault");

		await orchestratorInstance.setEmergencyBurnFee(ethVaultInstance.address);
		expect(await ethVaultInstance.burnFee()).to.eq(0);
	});

	it("...should be able to retrieve funds from vault", async () => {
		await expect(
			orchestratorInstance.connect(addr1).retrieveVaultFees(ethVaultInstance.address)
		).to.be.revertedWith("Ownable: caller is not the owner");

		await expect(
			orchestratorInstance.retrieveVaultFees(ethersProvider.constants.AddressZero)
		).to.be.revertedWith("Not a valid vault");

		await expect(orchestratorInstance.retrieveVaultFees(ethVaultInstance.address))
			.to.emit(ethVaultInstance, "LogRetrieveFees")
			.withArgs(orchestratorInstance.address, 0);
	});

	it("...should be able to send funds to owner of orchestrator", async () => {
		await expect(orchestratorInstance.connect(addr1).retrieveFees()).to.be.revertedWith(
			"Ownable: caller is not the owner"
		);

		//tested on vault
		await orchestratorInstance.retrieveFees();
	});

	it("...should enable the TCAP cap", async () => {
		let enableCap = true;

		await expect(
			orchestratorInstance.connect(addr1).enableTCAPCap(tcapInstance.address, false)
		).to.be.revertedWith("Ownable: caller is not the owner");

		await expect(
			orchestratorInstance.enableTCAPCap(ethersProvider.constants.AddressZero, false)
		).to.be.revertedWith("Not a valid TCAP ERC2");

		await expect(orchestratorInstance.enableTCAPCap(tcapInstance.address, enableCap))
			.to.emit(tcapInstance, "LogEnableCap")
			.withArgs(orchestratorInstance.address, enableCap);

		expect(enableCap).to.eq(await tcapInstance.capEnabled());
	});

	it("...should set the TCAP cap", async () => {
		let tcapCap = 100;

		await expect(
			orchestratorInstance.connect(addr1).setTCAPCap(tcapInstance.address, 0)
		).to.be.revertedWith("Ownable: caller is not the owner");

		await expect(
			orchestratorInstance.setTCAPCap(ethersProvider.constants.AddressZero, 0)
		).to.be.revertedWith("Not a valid TCAP ERC20");

		await expect(orchestratorInstance.setTCAPCap(tcapInstance.address, tcapCap))
			.to.emit(tcapInstance, "LogSetCap")
			.withArgs(orchestratorInstance.address, tcapCap);

		expect(tcapCap).to.eq(await tcapInstance.cap());
	});

	it("...should add vault to TCAP token", async () => {
		await expect(
			orchestratorInstance
				.connect(addr1)
				.addTCAPVault(tcapInstance.address, ethVaultInstance.address)
		).to.be.revertedWith("Ownable: caller is not the owner");

		await expect(
			orchestratorInstance.addTCAPVault(
				ethersProvider.constants.AddressZero,
				ethVaultInstance.address
			)
		).to.be.revertedWith("Not a valid TCAP ERC20");

		await expect(
			orchestratorInstance.addTCAPVault(tcapInstance.address, ethersProvider.constants.AddressZero)
		).to.be.revertedWith("Not a valid vault");

		await expect(orchestratorInstance.addTCAPVault(tcapInstance.address, ethVaultInstance.address))
			.to.emit(tcapInstance, "LogAddTokenHandler")
			.withArgs(orchestratorInstance.address, ethVaultInstance.address);
	});
});
