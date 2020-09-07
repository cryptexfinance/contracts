var expect = require("chai").expect;
var ethersProvider = require("ethers");

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
});
