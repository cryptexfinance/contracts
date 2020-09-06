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
		);
		let currentDivisor = await ethVaultInstance.divisor();
		let currentRatio = await ethVaultInstance.ratio();
		let currentBurnFee = await ethVaultInstance.burnFee();
		let currentLiquidaionPenalty = await ethVaultInstance.liquidationPenalty();
		let currentWhitelist = await ethVaultInstance.whitelistEnabled();
		let currentTcapOracle = await ethVaultInstance.tcapOracle();
		let currentTcap = await ethVaultInstance.TCAPToken();
		let currentCollateral = await ethVaultInstance.collateralContract();
		let currentCollateralOracle = await ethVaultInstance.collateralPriceOracle();
		let currentEthOracle = await ethVaultInstance.ETHPriceOracle();
		expect(currentDivisor).to.eq(divisor);
		expect(currentRatio).to.eq(ratio);
		expect(currentBurnFee).to.eq(burnFee);
		expect(currentLiquidaionPenalty).to.eq(liquidationPenalty);
		expect(currentWhitelist).to.eq(whitelistEnabled);
		expect(currentTcapOracle).to.eq(tcapOracle);
		expect(currentTcap).to.eq(tcapAddress);
		expect(currentCollateral).to.eq(collateralAddress);
		expect(currentCollateralOracle).to.eq(collateralOracle);
		expect(currentEthOracle).to.eq(ethOracle);
	});
});
