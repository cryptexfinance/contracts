var expect = require("chai").expect;
var ethersProvider = require("ethers");
const bre = require("@nomiclabs/buidler");

describe("Orchestrator Contract", async function () {
	let orchestratorInstance, tcapInstance, tcapInstance2, ethVaultInstance;
	let [owner, addr1, handler, handler2] = [];
	let accounts = [];
	let divisor = "10000000000";
	let ratio = "150";
	let burnFee = "1";
	let liquidationPenalty = "10";
	let whitelistEnabled = false;
	let tcapOracle = (collateralAddress = collateralOracle = ethOracle =
		ethersProvider.constants.AddressZero);
	const THREE_DAYS = 259200;
	const TWO_DAYS = 172800;

	const fns = {
		DIVISOR: 0,
		RATIO: 1,
		BURNFEE: 2,
		LIQUIDATION: 3,
		WHITELIST: 4,
		TCAP: 5,
		TCAPORACLE: 6,
		COLLATERAL: 7,
		COLLATERALORACLE: 8,
		ETHORACLE: 9,
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
		//TCAP
		const TCAP = await ethers.getContractFactory("TCAP");
		tcapInstance = await TCAP.deploy("Total Market Cap Token", "TCAP", 18);
		await tcapInstance.deployed();
		tcapInstance2 = await TCAP.deploy("Total Market Cap Token", "TCAP2", 18);
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
	});

	it("...should set the owner", async () => {
		const defaultOwner = await orchestratorInstance.owner();
		expect(defaultOwner).to.eq(accounts[0]);
	});

	it("...should validate the data on initialize", async () => {
		await expect(
			orchestratorInstance.initializeVault(
				ethersProvider.constants.AddressZero,
				divisor,
				ratio,
				burnFee,
				liquidationPenalty,
				whitelistEnabled,
				tcapOracle,
				tcapInstance.address,
				collateralAddress,
				collateralOracle,
				ethOracle
			)
		).to.be.revertedWith("Not a valid vault");

		await expect(
			orchestratorInstance.initializeVault(
				ethVaultInstance.address,
				divisor,
				ratio,
				burnFee,
				liquidationPenalty,
				whitelistEnabled,
				ethersProvider.constants.AddressZero,
				tcapInstance.address,
				collateralAddress,
				collateralOracle,
				ethOracle
			)
		).to.be.revertedWith("Not a valid Chainlink Oracle");

		await expect(
			orchestratorInstance.initializeVault(
				ethVaultInstance.address,
				divisor,
				ratio,
				burnFee,
				liquidationPenalty,
				whitelistEnabled,
				tcapOracle,
				ethersProvider.constants.AddressZero,
				collateralAddress,
				collateralOracle,
				ethOracle
			)
		).to.be.revertedWith("Not a valid TCAP ERC20");

		await expect(
			orchestratorInstance.initializeVault(
				ethVaultInstance.address,
				divisor,
				ratio,
				burnFee,
				liquidationPenalty,
				whitelistEnabled,
				tcapOracle,
				tcapInstance.address,
				collateralAddress,
				ethersProvider.constants.AddressZero,
				ethOracle
			)
		).to.be.revertedWith("Not a valid Chainlink Oracle");

		await expect(
			orchestratorInstance.initializeVault(
				ethVaultInstance.address,
				divisor,
				ratio,
				burnFee,
				liquidationPenalty,
				whitelistEnabled,
				tcapOracle,
				tcapInstance.address,
				collateralAddress,
				collateralOracle,
				ethersProvider.constants.AddressZero
			)
		).to.be.revertedWith("Not a valid Chainlink Oracle");
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
					tcapInstance.address,
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
			tcapInstance.address,
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
		expect(tcapInstance.address).to.eq(await ethVaultInstance.TCAPToken());
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
				tcapInstance.address,
				collateralAddress,
				collateralOracle,
				ethOracle
			)
		).to.be.revertedWith("Contract already initialized");
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
		);
		//fast-forward
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

		await expect(orchestratorInstance.setDivisor(ethVaultInstance.address, 0)).to.be.revertedWith(
			"Function is timelocked"
		);
	});

	it("...should set vault ratio", async () => {
		let ratio = "200";

		await expect(orchestratorInstance.setRatio(ethVaultInstance.address, 0)).to.be.revertedWith(
			"Function is timelocked"
		);
		await orchestratorInstance.unlockVaultFunction(fns.RATIO);
		//fast-forward
		bre.network.provider.send("evm_increaseTime", [THREE_DAYS]);

		await expect(
			orchestratorInstance.connect(addr1).setRatio(ethVaultInstance.address, 0)
		).to.be.revertedWith("Ownable: caller is not the owner");

		await expect(
			orchestratorInstance.setRatio(ethersProvider.constants.AddressZero, 0)
		).to.be.revertedWith("Not a valid vault");

		await orchestratorInstance.setRatio(ethVaultInstance.address, ratio);
		expect(ratio).to.eq(await ethVaultInstance.ratio());

		await expect(orchestratorInstance.setRatio(ethVaultInstance.address, 0)).to.be.revertedWith(
			"Function is timelocked"
		);
	});

	it("...should set vault burn fee", async () => {
		let burnFee = "2";

		await expect(orchestratorInstance.setBurnFee(ethVaultInstance.address, 0)).to.be.revertedWith(
			"Function is timelocked"
		);
		await orchestratorInstance.unlockVaultFunction(fns.BURNFEE);
		//fast-forward
		bre.network.provider.send("evm_increaseTime", [THREE_DAYS]);

		await expect(
			orchestratorInstance.connect(addr1).setBurnFee(ethVaultInstance.address, 0)
		).to.be.revertedWith("Ownable: caller is not the owner");

		await expect(
			orchestratorInstance.setBurnFee(ethersProvider.constants.AddressZero, 0)
		).to.be.revertedWith("Not a valid vault");

		await orchestratorInstance.setBurnFee(ethVaultInstance.address, burnFee);
		expect(burnFee).to.eq(await ethVaultInstance.burnFee());
		await expect(orchestratorInstance.setBurnFee(ethVaultInstance.address, 0)).to.be.revertedWith(
			"Function is timelocked"
		);
	});

	it("...should set vault liquidation penalty", async () => {
		let liquidationPenalty = "15";

		await expect(
			orchestratorInstance.setLiquidationPenalty(ethVaultInstance.address, 0)
		).to.be.revertedWith("Function is timelocked");
		await orchestratorInstance.unlockVaultFunction(fns.LIQUIDATION);
		//fast-forward
		bre.network.provider.send("evm_increaseTime", [THREE_DAYS]);

		await expect(
			orchestratorInstance.connect(addr1).setLiquidationPenalty(ethVaultInstance.address, 0)
		).to.be.revertedWith("Ownable: caller is not the owner");

		await expect(
			orchestratorInstance.setLiquidationPenalty(ethersProvider.constants.AddressZero, 0)
		).to.be.revertedWith("Not a valid vault");

		await orchestratorInstance.setLiquidationPenalty(ethVaultInstance.address, liquidationPenalty);
		expect(liquidationPenalty).to.eq(await ethVaultInstance.liquidationPenalty());
		await expect(
			orchestratorInstance.setLiquidationPenalty(ethVaultInstance.address, 0)
		).to.be.revertedWith("Function is timelocked");
	});

	it("...should enable vault whitelist", async () => {
		let whitelist = true;

		await expect(
			orchestratorInstance.setWhitelist(ethVaultInstance.address, false)
		).to.be.revertedWith("Function is timelocked");
		await orchestratorInstance.unlockVaultFunction(fns.WHITELIST);
		//fast-forward
		bre.network.provider.send("evm_increaseTime", [THREE_DAYS]);

		await expect(
			orchestratorInstance.connect(addr1).setWhitelist(ethVaultInstance.address, false)
		).to.be.revertedWith("Ownable: caller is not the owner");

		await expect(
			orchestratorInstance.setWhitelist(ethersProvider.constants.AddressZero, false)
		).to.be.revertedWith("Not a valid vault");

		await orchestratorInstance.setWhitelist(ethVaultInstance.address, whitelist);
		expect(whitelist).to.eq(await ethVaultInstance.whitelistEnabled());
		await expect(
			orchestratorInstance.setWhitelist(ethVaultInstance.address, false)
		).to.be.revertedWith("Function is timelocked");
	});

	it("...should set vault TCAP Contract", async () => {
		let tcap = tcapInstance2.address;
		await expect(orchestratorInstance.setTCAP(ethVaultInstance.address, tcap)).to.be.revertedWith(
			"Function is timelocked"
		);
		await orchestratorInstance.unlockVaultFunction(fns.TCAP);
		//fast-forward
		bre.network.provider.send("evm_increaseTime", [THREE_DAYS]);

		await expect(
			orchestratorInstance
				.connect(addr1)
				.setTCAP(ethVaultInstance.address, ethersProvider.constants.AddressZero)
		).to.be.revertedWith("Ownable: caller is not the owner");

		await expect(
			orchestratorInstance.setTCAP(ethersProvider.constants.AddressZero, tcap)
		).to.be.revertedWith("Not a valid vault");

		await expect(
			orchestratorInstance.setTCAP(ethVaultInstance.address, ethersProvider.constants.AddressZero)
		).to.be.revertedWith("Not a valid TCAP ERC20");

		await orchestratorInstance.setTCAP(ethVaultInstance.address, tcap);
		expect(tcap).to.eq(await ethVaultInstance.TCAPToken());
		await expect(
			orchestratorInstance.setTCAP(ethVaultInstance.address, ethersProvider.constants.AddressZero)
		).to.be.revertedWith("Function is timelocked");
	});

	it("...should set vault TCAP Oracle Contract", async () => {
		let tcapOracle = collateralOracle;
		await expect(
			orchestratorInstance.setTCAPOracle(ethVaultInstance.address, tcapOracle)
		).to.be.revertedWith("Function is timelocked");
		await orchestratorInstance.unlockVaultFunction(fns.TCAPORACLE);
		//fast-forward
		bre.network.provider.send("evm_increaseTime", [THREE_DAYS]);

		await expect(
			orchestratorInstance
				.connect(addr1)
				.setTCAPOracle(ethVaultInstance.address, ethersProvider.constants.AddressZero)
		).to.be.revertedWith("Ownable: caller is not the owner");

		await expect(
			orchestratorInstance.setTCAPOracle(ethersProvider.constants.AddressZero, tcapOracle)
		).to.be.revertedWith("Not a valid vault");

		await expect(
			orchestratorInstance.setTCAPOracle(
				ethVaultInstance.address,
				ethersProvider.constants.AddressZero
			)
		).to.be.revertedWith("Not a valid Chainlink Oracle");

		await orchestratorInstance.setTCAPOracle(ethVaultInstance.address, tcapOracle);
		expect(tcapOracle).to.eq(await ethVaultInstance.tcapOracle());
		await expect(
			orchestratorInstance.setTCAPOracle(
				ethVaultInstance.address,
				ethersProvider.constants.AddressZero
			)
		).to.be.revertedWith("Function is timelocked");
	});

	it("...should set vault Collateral Contract", async () => {
		const weth = await ethers.getContractFactory("WETH");
		let wethTokenInstance = await weth.deploy();
		let collateralContract = wethTokenInstance.address;
		await expect(
			orchestratorInstance.setCollateral(ethVaultInstance.address, collateralContract)
		).to.be.revertedWith("Function is timelocked");
		await orchestratorInstance.unlockVaultFunction(fns.COLLATERAL);
		//fast-forward
		bre.network.provider.send("evm_increaseTime", [THREE_DAYS]);

		await expect(
			orchestratorInstance
				.connect(addr1)
				.setCollateral(ethVaultInstance.address, ethersProvider.constants.AddressZero)
		).to.be.revertedWith("Ownable: caller is not the owner");

		await expect(
			orchestratorInstance.setCollateral(ethersProvider.constants.AddressZero, collateralContract)
		).to.be.revertedWith("Not a valid vault");

		await orchestratorInstance.setCollateral(ethVaultInstance.address, collateralContract);
		expect(collateralContract).to.eq(await ethVaultInstance.collateralContract());
		await expect(
			orchestratorInstance.setCollateral(
				ethVaultInstance.address,
				ethersProvider.constants.AddressZero
			)
		).to.be.revertedWith("Function is timelocked");
	});

	it("...should set vault Collateral Oracle Contract", async () => {
		let collateralOracle = ethOracle;
		await expect(
			orchestratorInstance.setCollateralOracle(ethVaultInstance.address, collateralOracle)
		).to.be.revertedWith("Function is timelocked");
		await orchestratorInstance.unlockVaultFunction(fns.COLLATERALORACLE);
		//fast-forward
		bre.network.provider.send("evm_increaseTime", [THREE_DAYS]);

		await expect(
			orchestratorInstance
				.connect(addr1)
				.setCollateralOracle(ethVaultInstance.address, ethersProvider.constants.AddressZero)
		).to.be.revertedWith("Ownable: caller is not the owner");

		await expect(
			orchestratorInstance.setCollateralOracle(
				ethersProvider.constants.AddressZero,
				collateralOracle
			)
		).to.be.revertedWith("Not a valid vault");

		await expect(
			orchestratorInstance.setCollateralOracle(
				ethVaultInstance.address,
				ethersProvider.constants.AddressZero
			)
		).to.be.revertedWith("Not a valid Chainlink Oracle");

		await orchestratorInstance.setCollateralOracle(ethVaultInstance.address, collateralOracle);
		expect(collateralOracle).to.eq(await ethVaultInstance.collateralPriceOracle());
		await expect(
			orchestratorInstance.setCollateralOracle(
				ethVaultInstance.address,
				ethersProvider.constants.AddressZero
			)
		).to.be.revertedWith("Function is timelocked");
	});

	it("...should set vault ETH Oracle Contract", async () => {
		let ethOracle = tcapOracle;
		await expect(
			orchestratorInstance.setETHOracle(ethVaultInstance.address, ethOracle)
		).to.be.revertedWith("Function is timelocked");
		await orchestratorInstance.unlockVaultFunction(fns.ETHORACLE);
		//fast-forward
		bre.network.provider.send("evm_increaseTime", [THREE_DAYS]);

		await expect(
			orchestratorInstance
				.connect(addr1)
				.setETHOracle(ethVaultInstance.address, ethersProvider.constants.AddressZero)
		).to.be.revertedWith("Ownable: caller is not the owner");

		await expect(
			orchestratorInstance.setETHOracle(ethersProvider.constants.AddressZero, ethOracle)
		).to.be.revertedWith("Not a valid vault");

		await expect(
			orchestratorInstance.setETHOracle(
				ethVaultInstance.address,
				ethersProvider.constants.AddressZero
			)
		).to.be.revertedWith("Not a valid Chainlink Oracle");

		await orchestratorInstance.setETHOracle(ethVaultInstance.address, ethOracle);
		expect(ethOracle).to.eq(await ethVaultInstance.ETHPriceOracle());
		await expect(
			orchestratorInstance.setETHOracle(
				ethVaultInstance.address,
				ethersProvider.constants.AddressZero
			)
		).to.be.revertedWith("Function is timelocked");
	});

	it("...should be able to call retrieve funds", async () => {
		await expect(
			orchestratorInstance.connect(addr1).retrieveFees(ethVaultInstance.address)
		).to.be.revertedWith("Ownable: caller is not the owner");

		await expect(
			orchestratorInstance.retrieveFees(ethersProvider.constants.AddressZero)
		).to.be.revertedWith("Not a valid vault");

		await expect(orchestratorInstance.retrieveFees(ethVaultInstance.address))
			.to.emit(ethVaultInstance, "LogRetrieveFees")
			.withArgs(orchestratorInstance.address, 0);
	});
});
