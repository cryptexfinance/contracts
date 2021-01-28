var expect = require("chai").expect;
var ethersProvider = require("ethers");

describe("Orchestrator Contract", async function () {
	let orchestratorInstance, tcapInstance, tcapInstance2, ethVaultInstance, btcVaultInstance;
	let [owner, addr1, handler, handler2, guardian] = [];
	let accounts = [];
	let divisor = "10000000000";
	let ratio = "150";
	let burnFee = "1";
	let liquidationPenalty = "10";
	let tcapOracle = (collateralAddress = collateralOracle = ethOracle =
		ethersProvider.constants.AddressZero);

	before("Set Accounts", async () => {
		let [acc0, acc1, acc3, acc4, acc5, acc6] = await ethers.getSigners();
		owner = acc0;
		addr1 = acc1;
		handler = acc3;
		handler2 = acc4;
		guardian = acc6;
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
		orchestratorInstance = await orchestrator.deploy(await guardian.getAddress());
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

	it("...should set the guardian", async () => {
		const currentGuardian = await orchestratorInstance.guardian();
		expect(currentGuardian).to.eq(await guardian.getAddress());

		await expect(
			orchestratorInstance.connect(addr1).setGuardian(await addr1.getAddress())
		).to.be.revertedWith("Ownable: caller is not the owner");

		await expect(
			orchestratorInstance.connect(owner).setGuardian(ethersProvider.constants.AddressZero)
		).to.be.revertedWith("Orchestrator::setGuardian: guardian can't be zero");

		await expect(orchestratorInstance.connect(owner).setGuardian(await addr1.getAddress()))
			.to.emit(orchestratorInstance, "LogSetGuardian")
			.withArgs(await owner.getAddress(), await addr1.getAddress());

		await orchestratorInstance.setGuardian(await guardian.getAddress());
	});

	it("...should set vault ratio", async () => {
		let ratio = "190";

		await expect(
			orchestratorInstance.connect(addr1).setRatio(ethVaultInstance.address, 0)
		).to.be.revertedWith("Ownable: caller is not the owner");

		await expect(
			orchestratorInstance.setRatio(ethersProvider.constants.AddressZero, 0)
		).to.be.revertedWith("Orchestrator::validVault: not a valid vault");

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
		).to.be.revertedWith("Orchestrator::validVault: not a valid vault");

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
		).to.be.revertedWith("Orchestrator::validVault: not a valid vault");

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
			orchestratorInstance.connect(owner).pauseVault(ethVaultInstance.address)
		).to.be.revertedWith("Orchestrator::onlyGuardian: caller is not the guardian");

		await expect(
			orchestratorInstance.connect(guardian).pauseVault(ethersProvider.constants.AddressZero)
		).to.be.revertedWith("Orchestrator::validVault: not a valid vault");

		await orchestratorInstance.connect(guardian).pauseVault(ethVaultInstance.address);
		expect(true).to.eq(await ethVaultInstance.paused());

		await expect(
			orchestratorInstance.connect(guardian).pauseVault(ethVaultInstance.address)
		).to.be.revertedWith("Orchestrator::pauseVault: emergency call already used");
		await orchestratorInstance.connect(guardian).pauseVault(btcVaultInstance.address);
		expect(true).to.eq(await btcVaultInstance.paused());
	});

	it("...should unpause the vault", async () => {
		await expect(
			orchestratorInstance.connect(owner).unpauseVault(ethVaultInstance.address)
		).to.be.revertedWith("Orchestrator::onlyGuardian: caller is not the guardian");

		await expect(
			orchestratorInstance.connect(guardian).unpauseVault(ethersProvider.constants.AddressZero)
		).to.be.revertedWith("Orchestrator::validVault: not a valid vault");

		await orchestratorInstance.connect(guardian).unpauseVault(ethVaultInstance.address);
		expect(false).to.eq(await ethVaultInstance.paused());
	});

	it("...should set the liquidation penalty to 0 on emergency", async () => {
		await expect(
			orchestratorInstance.connect(owner).setEmergencyLiquidationPenalty(ethVaultInstance.address)
		).to.be.revertedWith("Orchestrator::onlyGuardian: caller is not the guardian");
		await expect(
			orchestratorInstance
				.connect(guardian)
				.setEmergencyLiquidationPenalty(ethersProvider.constants.AddressZero)
		).to.be.revertedWith("Orchestrator::validVault: not a valid vault");
		await orchestratorInstance
			.connect(guardian)
			.setEmergencyLiquidationPenalty(ethVaultInstance.address);
		expect(await ethVaultInstance.liquidationPenalty()).to.eq(0);
		await expect(
			orchestratorInstance
				.connect(guardian)
				.setEmergencyLiquidationPenalty(ethVaultInstance.address)
		).to.be.revertedWith(
			"Orchestrator::setEmergencyLiquidationPenalty: emergency call already used"
		);
		await orchestratorInstance
			.connect(guardian)
			.setEmergencyLiquidationPenalty(btcVaultInstance.address);
		expect(await btcVaultInstance.liquidationPenalty()).to.eq(0);
	});

	it("...should set the burn fee to 0 on emergency", async () => {
		await expect(
			orchestratorInstance.connect(owner).setEmergencyBurnFee(ethVaultInstance.address)
		).to.be.revertedWith("Orchestrator::onlyGuardian: caller is not the guardian");
		await expect(
			orchestratorInstance
				.connect(guardian)
				.setEmergencyBurnFee(ethersProvider.constants.AddressZero)
		).to.be.revertedWith("Orchestrator::validVault: not a valid vault");

		await orchestratorInstance.connect(guardian).setEmergencyBurnFee(ethVaultInstance.address);
		expect(await ethVaultInstance.burnFee()).to.eq(0);
		await expect(
			orchestratorInstance.connect(guardian).setEmergencyBurnFee(ethVaultInstance.address)
		).to.be.revertedWith("Orchestrator::setEmergencyBurnFee: emergency call already used");
		await orchestratorInstance.connect(guardian).setEmergencyBurnFee(btcVaultInstance.address);
		expect(await btcVaultInstance.burnFee()).to.eq(0);
	});

	it("...should be able to retrieve funds from vault", async () => {
		await expect(
			orchestratorInstance.connect(addr1).retrieveVaultFees(ethVaultInstance.address)
		).to.be.revertedWith("Ownable: caller is not the owner");

		await expect(
			orchestratorInstance.retrieveVaultFees(ethersProvider.constants.AddressZero)
		).to.be.revertedWith("Orchestrator::validVault: not a valid vault");

		await expect(orchestratorInstance.retrieveVaultFees(ethVaultInstance.address))
			.to.emit(ethVaultInstance, "FeesRetrieved")
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
		).to.be.revertedWith("Orchestrator::validTCAP: not a valid TCAP ERC20");

		await expect(orchestratorInstance.enableTCAPCap(tcapInstance.address, enableCap))
			.to.emit(tcapInstance, "NewCapEnabled")
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
		).to.be.revertedWith("Orchestrator::validTCAP: not a valid TCAP ERC20");

		await expect(orchestratorInstance.setTCAPCap(tcapInstance.address, tcapCap))
			.to.emit(tcapInstance, "NewCap")
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
		).to.be.revertedWith("Orchestrator::validTCAP: not a valid TCAP ERC20");

		await expect(
			orchestratorInstance.addTCAPVault(tcapInstance.address, ethersProvider.constants.AddressZero)
		).to.be.revertedWith("Orchestrator::validVault: not a valid vault");

		await expect(orchestratorInstance.addTCAPVault(tcapInstance.address, ethVaultInstance.address))
			.to.emit(tcapInstance, "VaultHandlerAdded")
			.withArgs(orchestratorInstance.address, ethVaultInstance.address);

		expect(await tcapInstance.vaultHandlers(ethVaultInstance.address)).to.eq(true);
	});

	it("...should remove vault to TCAP token", async () => {
		await expect(
			orchestratorInstance
				.connect(addr1)
				.removeTCAPVault(tcapInstance.address, ethVaultInstance.address)
		).to.be.revertedWith("Ownable: caller is not the owner");

		await expect(
			orchestratorInstance.removeTCAPVault(
				ethersProvider.constants.AddressZero,
				ethVaultInstance.address
			)
		).to.be.revertedWith("Orchestrator::validTCAP: not a valid TCAP ERC20");

		await expect(
			orchestratorInstance.removeTCAPVault(
				tcapInstance.address,
				ethersProvider.constants.AddressZero
			)
		).to.be.revertedWith("Orchestrator::validVault: not a valid vault");

		await expect(
			orchestratorInstance.removeTCAPVault(tcapInstance.address, ethVaultInstance.address)
		)
			.to.emit(tcapInstance, "VaultHandlerRemoved")
			.withArgs(orchestratorInstance.address, ethVaultInstance.address);

		expect(await tcapInstance.vaultHandlers(ethVaultInstance.address)).to.eq(false);
	});

	it("...should allow to execute a custom transaction", async () => {
		await orchestratorInstance.addTCAPVault(tcapInstance.address, ethVaultInstance.address);

		let currentOwner = await tcapInstance.owner();
		expect(currentOwner).to.eq(orchestratorInstance.address);
		const newOwner = await addr1.getAddress();
		const abi = new ethers.utils.AbiCoder();
		const target = tcapInstance.address;
		const value = 0;
		const signature = "transferOwnership(address)";
		const data = abi.encode(["address"], [newOwner]);

		await expect(
			orchestratorInstance.connect(addr1).executeTransaction(target, value, signature, data)
		).to.be.revertedWith("Ownable: caller is not the owner");

		const wrongData = abi.encode(["address"], [ethers.constants.AddressZero]);
		await expect(
			orchestratorInstance.executeTransaction(target, value, signature, wrongData)
		).to.be.revertedWith("Orchestrator::executeTransaction: Transaction execution reverted.");

		await expect(orchestratorInstance.executeTransaction(target, value, signature, data))
			.to.emit(orchestratorInstance, "LogExecuteTransaction")
			.withArgs(target, value, signature, data);

		currentOwner = await tcapInstance.owner();
		expect(currentOwner).to.eq(newOwner);
	});
});
