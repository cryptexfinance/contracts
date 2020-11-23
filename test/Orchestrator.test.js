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

	const fns = {
		RATIO: 0,
		BURNFEE: 1,
		LIQUIDATION: 2,
		ENABLECAP: 3,
		SETCAP: 4,
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
	//TODO: print logs on sets

	it("...should deploy the contract", async () => {
		const orchestrator = await ethers.getContractFactory("Orchestrator");
		orchestratorInstance = await orchestrator.deploy();
		await orchestratorInstance.deployed();
		expect(orchestratorInstance.address).properAddress;
		//Vaults
		const wethVault = await ethers.getContractFactory("ERC20VaultHandler");
		ethVaultInstance = await wethVault.deploy(orchestratorInstance.address);
		await ethVaultInstance.deployed();
		expect(ethVaultInstance.address).properAddress;

		btcVaultInstance = await wethVault.deploy(orchestratorInstance.address);
		await btcVaultInstance.deployed();
		expect(btcVaultInstance.address).properAddress;
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
				tcapOracle,
				tcapInstance.address,
				collateralAddress,
				collateralOracle,
				ethersProvider.constants.AddressZero
			)
		).to.be.revertedWith("Not a valid Chainlink Oracle");

		let liquidationPenaltyBreak = "90";
		await expect(
			orchestratorInstance.initializeVault(
				ethVaultInstance.address,
				divisor,
				ratio,
				burnFee,
				liquidationPenaltyBreak,
				tcapOracle,
				tcapInstance.address,
				collateralAddress,
				collateralOracle,
				ethOracle
			)
		).to.be.revertedWith("Liquidation penalty too high");
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
					tcapOracle,
					tcapInstance.address,
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
				tcapOracle,
				tcapInstance.address,
				collateralAddress,
				collateralOracle,
				ethOracle
			)
		)
			.to.emit(ethVaultInstance, "LogInitializeVault")
			.withArgs(
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
		expect(divisor).to.eq(await ethVaultInstance.divisor());
		expect(ratio).to.eq(await ethVaultInstance.ratio());
		expect(burnFee).to.eq(await ethVaultInstance.burnFee());
		expect(liquidationPenalty).to.eq(await ethVaultInstance.liquidationPenalty());
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
				tcapOracle,
				tcapInstance.address,
				collateralAddress,
				collateralOracle,
				ethOracle
			)
		).to.be.revertedWith("Contract already initialized");
	});

	it("...should allow to unlock timelock for a function", async () => {
		let ratioHash = ethers.utils.solidityKeccak256(["uint256"], [ratio]);
		await expect(
			orchestratorInstance
				.connect(addr1)
				.unlockFunction(ethVaultInstance.address, fns.RATIO, ratioHash)
		).to.be.revertedWith("Ownable: caller is not the owner");

		await expect(
			orchestratorInstance.unlockFunction(ethVaultInstance.address, fns.RATIO, ratioHash)
		)
			.to.emit(orchestratorInstance, "LogUnlock")
			.withArgs(ethVaultInstance.address, fns.RATIO, ratioHash);
		expect(await orchestratorInstance.timelock(ethVaultInstance.address, fns.RATIO)).to.not.eq(0);
		expect(await orchestratorInstance.timelockValue(ethVaultInstance.address, fns.RATIO)).to.eq(
			ratioHash
		);
		expect(Date.now()).to.lte(
			(await orchestratorInstance.timelock(ethVaultInstance.address, fns.RATIO)).mul(1000)
		);

		await expect(orchestratorInstance.setRatio(ethVaultInstance.address, 0)).to.be.revertedWith(
			"Function is timelocked"
		);
		//fast-forward
		bre.network.provider.send("evm_increaseTime", [TWO_DAYS]);
		await expect(orchestratorInstance.setRatio(ethVaultInstance.address, 0)).to.be.revertedWith(
			"Function is timelocked"
		);
		//fast-forward
		bre.network.provider.send("evm_increaseTime", [TWO_DAYS]);
		await expect(orchestratorInstance.setRatio(btcVaultInstance.address, 0)).to.be.revertedWith(
			"Function is timelocked"
		);
		await expect(orchestratorInstance.setRatio(ethVaultInstance.address, 200)).to.be.revertedWith(
			"Not defined timelock value"
		);
		await orchestratorInstance.setRatio(ethVaultInstance.address, ratio);
	});

	it("...should allow to lock again a function", async () => {
		await expect(
			orchestratorInstance.connect(addr1).lockVaultFunction(ethVaultInstance.address, fns.RATIO)
		).to.be.revertedWith("Ownable: caller is not the owner");

		await orchestratorInstance.lockVaultFunction(ethVaultInstance.address, fns.RATIO);
		expect(await orchestratorInstance.timelock(ethVaultInstance.address, fns.RATIO)).to.eq(0);
	});

	it("...should set vault ratio", async () => {
		let ratio = "190";
		let ratioHash = ethers.utils.solidityKeccak256(["uint256"], [ratio]);

		await expect(orchestratorInstance.setRatio(ethVaultInstance.address, 0)).to.be.revertedWith(
			"Function is timelocked"
		);
		await orchestratorInstance.unlockFunction(ethVaultInstance.address, fns.RATIO, ratioHash);
		//fast-forward
		bre.network.provider.send("evm_increaseTime", [THREE_DAYS]);

		await expect(
			orchestratorInstance.connect(addr1).setRatio(ethVaultInstance.address, 0)
		).to.be.revertedWith("Ownable: caller is not the owner");

		await expect(
			orchestratorInstance.setRatio(ethersProvider.constants.AddressZero, 0)
		).to.be.revertedWith("Not a valid vault");

		await expect(orchestratorInstance.setRatio(btcVaultInstance.address, ratio)).to.be.revertedWith(
			"Function is timelocked"
		);

		await expect(orchestratorInstance.setRatio(ethVaultInstance.address, 10)).to.be.revertedWith(
			"Not defined timelock value"
		);

		await orchestratorInstance.setRatio(ethVaultInstance.address, ratio);
		expect(ratio).to.eq(await ethVaultInstance.ratio());

		await expect(orchestratorInstance.setRatio(ethVaultInstance.address, 0)).to.be.revertedWith(
			"Function is timelocked"
		);
	});

	it("...should set vault burn fee", async () => {
		let burnFee = "2";
		let feeHash = ethers.utils.solidityKeccak256(["uint256"], [burnFee]);

		await expect(orchestratorInstance.setBurnFee(ethVaultInstance.address, 0)).to.be.revertedWith(
			"Function is timelocked"
		);
		await orchestratorInstance.unlockFunction(ethVaultInstance.address, fns.BURNFEE, feeHash);
		//fast-forward
		bre.network.provider.send("evm_increaseTime", [THREE_DAYS]);

		await expect(
			orchestratorInstance.connect(addr1).setBurnFee(ethVaultInstance.address, 0)
		).to.be.revertedWith("Ownable: caller is not the owner");

		await expect(
			orchestratorInstance.setBurnFee(ethersProvider.constants.AddressZero, 0)
		).to.be.revertedWith("Not a valid vault");

		await expect(orchestratorInstance.setBurnFee(ethVaultInstance.address, 10)).to.be.revertedWith(
			"Not defined timelock value"
		);

		await orchestratorInstance.setBurnFee(ethVaultInstance.address, burnFee);
		expect(burnFee).to.eq(await ethVaultInstance.burnFee());
		await expect(orchestratorInstance.setBurnFee(ethVaultInstance.address, 0)).to.be.revertedWith(
			"Function is timelocked"
		);
	});

	it("...should set vault liquidation penalty", async () => {
		let liquidationPenalty = "15";
		let penaltyHash = ethers.utils.solidityKeccak256(["uint256"], [liquidationPenalty]);

		await expect(
			orchestratorInstance.setLiquidationPenalty(ethVaultInstance.address, 0)
		).to.be.revertedWith("Function is timelocked");
		await orchestratorInstance.unlockFunction(
			ethVaultInstance.address,
			fns.LIQUIDATION,
			penaltyHash
		);
		//fast-forward
		bre.network.provider.send("evm_increaseTime", [THREE_DAYS]);

		await expect(
			orchestratorInstance.connect(addr1).setLiquidationPenalty(ethVaultInstance.address, 0)
		).to.be.revertedWith("Ownable: caller is not the owner");

		await expect(
			orchestratorInstance.setLiquidationPenalty(ethersProvider.constants.AddressZero, 0)
		).to.be.revertedWith("Not a valid vault");

		await expect(
			orchestratorInstance.setLiquidationPenalty(ethVaultInstance.address, 10)
		).to.be.revertedWith("Not defined timelock value");

		await orchestratorInstance.setLiquidationPenalty(ethVaultInstance.address, liquidationPenalty);
		expect(liquidationPenalty).to.eq(await ethVaultInstance.liquidationPenalty());
		await expect(
			orchestratorInstance.setLiquidationPenalty(ethVaultInstance.address, 0)
		).to.be.revertedWith("Function is timelocked");
	});

	it("...should prevent liquidation penalty + 100 to be above ratio", async () => {
		let liquidationPenalty = "90";

		let penaltyHash = ethers.utils.solidityKeccak256(["uint256"], [liquidationPenalty]);

		await orchestratorInstance.unlockFunction(
			ethVaultInstance.address,
			fns.LIQUIDATION,
			penaltyHash
		);
		//fast-forward
		bre.network.provider.send("evm_increaseTime", [THREE_DAYS]);

		await expect(
			orchestratorInstance.setLiquidationPenalty(ethVaultInstance.address, liquidationPenalty)
		).to.be.revertedWith("Liquidation penalty too high");
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
		let enableHash = ethers.utils.solidityKeccak256(["bool"], [enableCap]);

		await expect(
			orchestratorInstance.enableTCAPCap(tcapInstance.address, enableCap)
		).to.be.revertedWith("Function is timelocked");
		await orchestratorInstance.unlockFunction(tcapInstance.address, fns.ENABLECAP, enableHash);
		//fast-forward
		bre.network.provider.send("evm_increaseTime", [THREE_DAYS]);

		await expect(
			orchestratorInstance.connect(addr1).enableTCAPCap(tcapInstance.address, false)
		).to.be.revertedWith("Ownable: caller is not the owner");

		await expect(
			orchestratorInstance.enableTCAPCap(ethersProvider.constants.AddressZero, false)
		).to.be.revertedWith("Not a valid TCAP ERC2");

		await expect(
			orchestratorInstance.enableTCAPCap(tcapInstance.address, false)
		).to.be.revertedWith("Not defined timelock value");

		await expect(orchestratorInstance.enableTCAPCap(tcapInstance.address, enableCap))
			.to.emit(tcapInstance, "LogEnableCap")
			.withArgs(orchestratorInstance.address, enableCap);

		expect(enableCap).to.eq(await tcapInstance.capEnabled());
		await expect(
			orchestratorInstance.enableTCAPCap(tcapInstance.address, false)
		).to.be.revertedWith("Function is timelocked");
	});

	it("...should set the TCAP cap", async () => {
		let tcapCap = 100;
		let capHash = ethers.utils.solidityKeccak256(["uint256"], [tcapCap]);

		await expect(orchestratorInstance.setTCAPCap(tcapInstance.address, tcapCap)).to.be.revertedWith(
			"Function is timelocked"
		);
		await orchestratorInstance.unlockFunction(tcapInstance.address, fns.SETCAP, capHash);
		//fast-forward
		bre.network.provider.send("evm_increaseTime", [THREE_DAYS]);

		await expect(
			orchestratorInstance.connect(addr1).setTCAPCap(tcapInstance.address, 0)
		).to.be.revertedWith("Ownable: caller is not the owner");

		await expect(
			orchestratorInstance.setTCAPCap(ethersProvider.constants.AddressZero, 0)
		).to.be.revertedWith("Not a valid TCAP ERC2");

		await expect(orchestratorInstance.setTCAPCap(tcapInstance.address, 0)).to.be.revertedWith(
			"Not defined timelock value"
		);

		await expect(orchestratorInstance.setTCAPCap(tcapInstance.address, tcapCap))
			.to.emit(tcapInstance, "LogSetCap")
			.withArgs(orchestratorInstance.address, tcapCap);

		expect(tcapCap).to.eq(await tcapInstance.cap());
		await expect(orchestratorInstance.setTCAPCap(tcapInstance.address, 0)).to.be.revertedWith(
			"Function is timelocked"
		);
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
