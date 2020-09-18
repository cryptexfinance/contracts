var expect = require("chai").expect;
var ethersProvider = require("ethers");

describe("WETH Vault", async function () {
	let wethTokenHandler,
		wethTokenInstance,
		tcapInstance,
		tcapOracleInstance,
		priceOracleInstance,
		aggregatorTCAPInstance,
		orchestratorInstance;
	let [owner, addr1, addr2, addr3, lq] = [];
	let accounts = [];
	let divisor = "10000000000";
	let ratio = "150";
	let burnFee = "1";
	let liquidationPenalty = "10";

	before("Set Accounts", async () => {
		let [acc0, acc1, acc3, acc4, acc5] = await ethers.getSigners();
		owner = acc0;
		addr1 = acc1;
		addr2 = acc3;
		addr3 = acc4;
		lq = acc5;
		if (owner && addr1) {
			accounts.push(await owner.getAddress());
			accounts.push(await addr1.getAddress());
			accounts.push(await addr2.getAddress());
			accounts.push(await addr3.getAddress());
			accounts.push(await lq.getAddress());
		}
	});

	it("...should deploy the contract", async () => {
		const orchestrator = await ethers.getContractFactory("Orchestrator");
		orchestratorInstance = await orchestrator.deploy();
		await orchestratorInstance.deployed();
		expect(orchestratorInstance.address).properAddress;

		const TCAP = await ethers.getContractFactory("TCAP");
		tcapInstance = await TCAP.deploy(
			"Total Market Cap Token",
			"TCAP",
			18,
			orchestratorInstance.address
		);
		await tcapInstance.deployed();
		const wethVault = await ethers.getContractFactory("VaultHandler");
		wethTokenHandler = await wethVault.deploy(orchestratorInstance.address);
		await wethTokenHandler.deployed();
		expect(wethTokenHandler.address).properAddress;
		const collateralOracle = await ethers.getContractFactory("ChainlinkOracle");
		const oracle = await ethers.getContractFactory("ChainlinkOracle");
		const aggregator = await ethers.getContractFactory("AggregatorInterface");
		const aggregatorTcap = await ethers.getContractFactory("AggregatorInterfaceTCAP");
		let aggregatorInstance = await aggregator.deploy();
		aggregatorTCAPInstance = await aggregatorTcap.deploy();
		priceOracleInstance = await collateralOracle.deploy(aggregatorInstance.address);
		tcapOracleInstance = await oracle.deploy(aggregatorTCAPInstance.address);
		await priceOracleInstance.deployed();
		await orchestratorInstance.addTCAPVault(tcapInstance.address, wethTokenHandler.address);
		const weth = await ethers.getContractFactory("WETH");
		wethTokenInstance = await weth.deploy();

		// Initialize Vault

		await orchestratorInstance.initializeVault(
			wethTokenHandler.address,
			divisor,
			ratio,
			burnFee,
			liquidationPenalty,
			tcapOracleInstance.address,
			tcapInstance.address,
			wethTokenInstance.address,
			priceOracleInstance.address,
			priceOracleInstance.address
		);
	});

	it("...should return the token price", async () => {
		let tcapPrice = await wethTokenHandler.TCAPPrice();
		let totalMarketCap = await tcapOracleInstance.getLatestAnswer();
		let result = totalMarketCap.div(divisor);
		expect(tcapPrice).to.eq(result);
	});

	it("...should allow users to create a vault", async () => {
		let vaultId = await wethTokenHandler.vaultToUser(accounts[1]);
		expect(vaultId).eq(0);
		await expect(wethTokenHandler.connect(addr1).createVault())
			.to.emit(wethTokenHandler, "LogCreateVault")
			.withArgs(accounts[1], 1);
		vaultId = await wethTokenHandler.vaultToUser(accounts[1]);
		expect(vaultId).eq(1);
		vaultId = await wethTokenHandler.vaultToUser(accounts[2]);
		expect(vaultId).eq(0);
		await expect(wethTokenHandler.connect(addr1).createVault()).to.be.revertedWith(
			"Vault already created"
		);
	});

	it("...should get vault by id", async () => {
		let vault = await wethTokenHandler.getVault(1);
		expect(vault[0]).to.eq(1);
		expect(vault[1]).to.eq(0);
		expect(vault[2]).to.eq(accounts[1]);
		expect(vault[3]).to.eq(0);
		vault = await wethTokenHandler.getVault(100);
		expect(vault[0]).to.eq(0);
		expect(vault[1]).to.eq(0);
		expect(vault[2]).to.eq(ethersProvider.constants.AddressZero);
		expect(vault[3]).to.eq(0);
	});

	it("...should allow iser to stake collateral", async () => {
		const amount = ethersProvider.utils.parseEther("375");
		await expect(wethTokenHandler.connect(addr3).addCollateral(amount)).to.be.revertedWith(
			"No Vault created"
		);
		let balance = await wethTokenInstance.balanceOf(accounts[1]);
		expect(balance).to.eq(0);

		await expect(wethTokenHandler.connect(addr1).addCollateral(amount)).to.be.revertedWith(
			"ERC20: transfer amount exceeds balance"
		);
		await wethTokenInstance.mint(accounts[1], amount);
		await expect(wethTokenHandler.connect(addr1).addCollateral(amount)).to.be.revertedWith(
			"ERC20: transfer amount exceeds allowance"
		);
		await wethTokenInstance.connect(addr1).approve(wethTokenHandler.address, amount);
		balance = await wethTokenInstance.balanceOf(accounts[1]);
		expect(balance).to.eq(amount);
		await expect(wethTokenHandler.connect(addr1).addCollateral(amount))
			.to.emit(wethTokenHandler, "LogAddCollateral")
			.withArgs(accounts[1], 1, amount);
		let vault = await wethTokenHandler.getVault(1);
		expect(vault[0]).to.eq(1);
		expect(vault[1]).to.eq(amount);
		expect(vault[2]).to.eq(accounts[1]);
		expect(vault[3]).to.eq(0);
		balance = await wethTokenInstance.balanceOf(accounts[1]);
		expect(balance).to.eq(0);
		balance = await wethTokenInstance.balanceOf(wethTokenHandler.address);
		expect(balance).to.eq(amount);
		await wethTokenInstance.mint(accounts[1], amount);
		await wethTokenInstance.connect(addr1).approve(wethTokenHandler.address, amount);
		await wethTokenHandler.connect(addr1).addCollateral(amount);
		vault = await wethTokenHandler.getVault(1);
		expect(vault[0]).to.eq(1);
		expect(vault[1]).to.eq(amount.add(amount));
		expect(vault[2]).to.eq(accounts[1]);
		expect(vault[3]).to.eq(0);
		balance = await wethTokenInstance.balanceOf(wethTokenHandler.address);
		expect(balance).to.eq(amount.add(amount));
	});

	it("...should allow user to retrieve unused collateral", async () => {
		const amount = ethersProvider.utils.parseEther("375");
		const bigAmount = ethersProvider.utils.parseEther("100375");
		let balance = await wethTokenInstance.balanceOf(accounts[1]);
		expect(balance).to.eq(0);

		await expect(wethTokenHandler.connect(addr3).removeCollateral(amount)).to.be.revertedWith(
			"No Vault created"
		);
		await expect(wethTokenHandler.connect(addr1).removeCollateral(bigAmount)).to.be.revertedWith(
			"Retrieve amount higher than collateral"
		);
		await expect(wethTokenHandler.connect(addr1).removeCollateral(amount))
			.to.emit(wethTokenHandler, "LogRemoveCollateral")
			.withArgs(accounts[1], 1, amount);

		let vault = await wethTokenHandler.getVault(1);
		expect(vault[0]).to.eq(1);
		expect(vault[1]).to.eq(amount);
		expect(vault[2]).to.eq(accounts[1]);
		expect(vault[3]).to.eq(0);
		balance = await wethTokenInstance.balanceOf(accounts[1]);
		expect(balance).to.eq(amount);
		balance = await wethTokenInstance.balanceOf(wethTokenHandler.address);
		expect(balance).to.eq(amount);
		await wethTokenHandler.connect(addr1).removeCollateral(amount);
		vault = await wethTokenHandler.getVault(1);
		expect(vault[0]).to.eq(1);
		expect(vault[1]).to.eq(0);
		expect(vault[2]).to.eq(accounts[1]);
		expect(vault[3]).to.eq(0);
		balance = await wethTokenInstance.balanceOf(accounts[1]);
		expect(balance).to.eq(amount.add(amount));
		balance = await wethTokenInstance.balanceOf(wethTokenHandler.address);
		expect(balance).to.eq(0);
	});

	it("...should return the correct minimal collateral required", async () => {
		let amount = ethersProvider.utils.parseEther("1");
		const reqAmount = await wethTokenHandler.requiredCollateral(amount);
		const ethPrice = await priceOracleInstance.getLatestAnswer();
		const tcapPrice = await wethTokenHandler.TCAPPrice();
		const ratio = await wethTokenHandler.ratio();
		let result = tcapPrice.mul(amount).mul(ratio).div(100).div(ethPrice);
		expect(reqAmount).to.eq(result);
	});

	it("...should allow user to mint tokens", async () => {
		const amount = ethersProvider.utils.parseEther("10");
		const amount2 = ethersProvider.utils.parseEther("11");
		const lowAmount = ethersProvider.utils.parseEther("1");
		const bigAmount = ethersProvider.utils.parseEther("100");
		const reqAmount2 = await wethTokenHandler.requiredCollateral(amount2);

		await wethTokenInstance.mint(accounts[1], reqAmount2);
		let tcapBalance = await tcapInstance.balanceOf(accounts[1]);
		expect(tcapBalance).to.eq(0);
		await wethTokenInstance.connect(addr1).approve(wethTokenHandler.address, reqAmount2);
		await wethTokenHandler.connect(addr1).addCollateral(reqAmount2);
		await expect(wethTokenHandler.connect(addr3).mint(amount)).to.be.revertedWith(
			"No Vault created"
		);
		await expect(wethTokenHandler.connect(addr1).mint(bigAmount)).to.be.revertedWith(
			"Not enough collateral"
		);
		await expect(wethTokenHandler.connect(addr1).mint(amount))
			.to.emit(wethTokenHandler, "LogMint")
			.withArgs(accounts[1], 1, amount);
		tcapBalance = await tcapInstance.balanceOf(accounts[1]);
		expect(tcapBalance).to.eq(amount);
		vault = await wethTokenHandler.getVault(1);
		expect(vault[0]).to.eq(1);
		expect(vault[1]).to.eq(reqAmount2);
		expect(vault[2]).to.eq(accounts[1]);
		expect(vault[3]).to.eq(amount);
		await expect(wethTokenHandler.connect(addr1).mint(lowAmount)).to.be.revertedWith(
			"Collateral below min required ratio"
		);
	});

	it("...should allow users to get collateral ratio", async () => {
		let ratio = await wethTokenHandler.getVaultRatio(2);
		expect(ratio).to.eq(0);
		ratio = await wethTokenHandler.getVaultRatio(1);
		expect(ratio).to.eq(164);
	});

	it("...shouln't allow users to retrieve stake unless debt is paid", async () => {
		let vault = await wethTokenHandler.getVault(1);
		await expect(wethTokenHandler.connect(addr1).removeCollateral(vault[1])).to.be.revertedWith(
			"Collateral below min required ratio"
		);
	});

	it("...should calculate the burn fee", async () => {
		let amount = ethersProvider.utils.parseEther("10");
		let divisor = 100;
		let tcapPrice = await wethTokenHandler.TCAPPrice();
		let ethPrice = await priceOracleInstance.getLatestAnswer();
		let result = tcapPrice.mul(amount).div(divisor).div(ethPrice);
		let fee = await wethTokenHandler.getFee(amount);
		expect(fee).to.eq(result);
		amount = ethersProvider.utils.parseEther("100");
		result = tcapPrice.mul(amount).div(divisor).div(ethPrice);
		fee = await wethTokenHandler.getFee(amount);
		expect(fee).to.eq(result);
	});

	it("...should allow users to burn tokens", async () => {
		const amount = ethersProvider.utils.parseEther("10");
		const amount2 = ethersProvider.utils.parseEther("11");
		const bigAmount = ethersProvider.utils.parseEther("100");
		const ethHighAmount = ethersProvider.utils.parseEther("50");
		const reqAmount2 = await wethTokenHandler.requiredCollateral(amount2);
		const ethAmount = await wethTokenHandler.getFee(amount);
		const ethAmount2 = await wethTokenHandler.getFee(bigAmount);

		await expect(wethTokenHandler.connect(addr3).burn(amount)).to.be.revertedWith(
			"No Vault created"
		);
		await expect(wethTokenHandler.connect(addr1).burn(amount)).to.be.revertedWith(
			"Burn fee different than required"
		);
		await expect(
			wethTokenHandler.connect(addr1).burn(bigAmount, {value: ethAmount2})
		).to.be.revertedWith("Amount greater than debt");
		await expect(
			wethTokenHandler.connect(addr1).burn(amount, {value: ethHighAmount})
		).to.be.revertedWith("Burn fee different than required");
		await expect(wethTokenHandler.connect(addr1).burn(amount, {value: ethAmount}))
			.to.emit(wethTokenHandler, "LogBurn")
			.withArgs(accounts[1], 1, amount);
		let tcapBalance = await tcapInstance.balanceOf(accounts[1]);
		expect(tcapBalance).to.eq(0);
		vault = await wethTokenHandler.getVault(1);
		expect(vault[0]).to.eq(1);
		expect(vault[1]).to.eq(reqAmount2);
		expect(vault[2]).to.eq(accounts[1]);
		expect(vault[3]).to.eq(0);

		let ethBalance = await ethers.provider.getBalance(wethTokenHandler.address);
		expect(ethBalance).to.eq(ethAmount);
	});

	it("...should update the collateral ratio", async () => {
		let ratio = await wethTokenHandler.getVaultRatio(1);
		expect(ratio).to.eq(0);
	});

	it("...should allow users to retrieve stake when debt is paid", async () => {
		let vault = await wethTokenHandler.getVault(1);
		await expect(wethTokenHandler.connect(addr1).removeCollateral(vault[1]))
			.to.emit(wethTokenHandler, "LogRemoveCollateral")
			.withArgs(accounts[1], 1, vault[1]);
		vault = await wethTokenHandler.getVault(1);
		expect(vault[0]).to.eq(1);
		expect(vault[1]).to.eq(0);
		expect(vault[2]).to.eq(accounts[1]);
		expect(vault[3]).to.eq(0);
	});

	it("...should allow owner to retrieve fees in the contract", async () => {
		let ethBalance = await ethers.provider.getBalance(wethTokenHandler.address);
		let accountBalance = await ethers.provider.getBalance(accounts[0]);
		let orchestratorBalance = await ethers.provider.getBalance(orchestratorInstance.address);
		await expect(wethTokenHandler.connect(addr3).retrieveFees()).to.be.revertedWith(
			"Ownable: caller is not the owner"
		);
		await expect(orchestratorInstance.connect(owner).retrieveVaultFees(wethTokenHandler.address))
			.to.emit(wethTokenHandler, "LogRetrieveFees")
			.withArgs(orchestratorInstance.address, ethBalance);
		let currentAccountBalance = await ethers.provider.getBalance(orchestratorInstance.address);
		expect(currentAccountBalance).to.eq(orchestratorBalance.add(ethBalance));
		await orchestratorInstance.connect(owner).retrieveFees();
		currentAccountBalance = await ethers.provider.getBalance(accounts[0]);
		expect(currentAccountBalance).to.gt(accountBalance);
		ethBalance = await ethers.provider.getBalance(wethTokenHandler.address);
		expect(ethBalance).to.eq(0);
		ethBalance = await ethers.provider.getBalance(orchestratorInstance.address);
		expect(ethBalance).to.eq(0);
	});

	it("...should test liquidation requirements", async () => {
		//Prepare for liquidation tests
		let amount = ethersProvider.utils.parseEther("10");

		const reqAmount = await wethTokenHandler.requiredCollateral(
			ethersProvider.utils.parseEther("11")
		);

		//liquidated
		await wethTokenHandler.connect(lq).createVault();
		await wethTokenInstance.mint(accounts[4], reqAmount);
		await wethTokenInstance.connect(lq).approve(wethTokenHandler.address, reqAmount);
		await wethTokenHandler.connect(lq).addCollateral(reqAmount);
		await wethTokenHandler.connect(lq).mint(amount);
		await expect(wethTokenHandler.connect(addr3).liquidateVault(99, 0)).to.be.revertedWith(
			"No Vault created"
		);
		await expect(wethTokenHandler.connect(addr3).liquidateVault(2, 0)).to.be.revertedWith(
			"Vault is not liquidable"
		);
		const totalMarketCap = "43129732288636297500";
		await aggregatorTCAPInstance.connect(owner).setLatestAnswer(totalMarketCap);
	});

	it("...should get the required collateral for liquidation", async () => {
		let reqLiquidation = await wethTokenHandler.requiredLiquidationCollateral(2);
		let liquidationPenalty = await wethTokenHandler.liquidationPenalty();
		let ratio = await wethTokenHandler.ratio();
		let collateralPrice = await priceOracleInstance.getLatestAnswer();
		let tcapPrice = await wethTokenHandler.TCAPPrice();
		let vault = await wethTokenHandler.getVault(2);
		let collateralTcap = vault[1].mul(collateralPrice).div(tcapPrice);
		let reqDividend = vault[3].mul(ratio).div(100).sub(collateralTcap).mul(100);
		let reqDivisor = ratio.sub(liquidationPenalty.add(100));
		let result = reqDividend.div(reqDivisor);
		expect(result).to.eq(reqLiquidation);
	});

	it("...should get the liquidation reward", async () => {
		let reqLiquidation = await wethTokenHandler.requiredLiquidationCollateral(2);
		let liquidationReward = await wethTokenHandler.liquidationReward(2);
		let liquidationPenalty = await wethTokenHandler.liquidationPenalty();
		let collateralPrice = await priceOracleInstance.getLatestAnswer();
		let tcapPrice = await wethTokenHandler.TCAPPrice();

		let result = reqLiquidation.mul(liquidationPenalty.add(100)).div(100);
		result = result.mul(tcapPrice).div(collateralPrice);
		expect(result).to.eq(liquidationReward);
	});

	it("...should allow liquidators to return profits", async () => {
		const divisor = ethersProvider.utils.parseEther("1");
		const liquidationReward = await wethTokenHandler.liquidationReward(2);
		const reqLiquidation = await wethTokenHandler.requiredLiquidationCollateral(2);
		const tcapPrice = await wethTokenHandler.TCAPPrice();
		const collateralPrice = await priceOracleInstance.getLatestAnswer();
		const rewardUSD = liquidationReward.mul(collateralPrice).div(divisor);
		const collateralUSD = reqLiquidation.mul(tcapPrice).div(divisor);
		expect(rewardUSD).to.be.gte(
			collateralUSD,
			"reward should be greater than collateral paid to liquidate"
		);
	});
	it("...should allow users to liquidate users on vault ratio less than ratio", async () => {
		let vaultRatio = await wethTokenHandler.getVaultRatio(2);
		let ethBalance = await ethers.provider.getBalance(wethTokenHandler.address);

		//liquidator setup
		let liquidatorAmount = ethersProvider.utils.parseEther("20");
		const reqLiquidatorAmount = await wethTokenHandler.requiredCollateral(
			ethersProvider.utils.parseEther("110")
		);
		await wethTokenHandler.connect(addr3).createVault();
		await wethTokenInstance.mint(accounts[3], reqLiquidatorAmount);
		await wethTokenInstance.connect(addr3).approve(wethTokenHandler.address, reqLiquidatorAmount);
		await wethTokenHandler.connect(addr3).addCollateral(reqLiquidatorAmount);
		await wethTokenHandler.connect(addr3).mint(liquidatorAmount);

		let liquidationReward = await wethTokenHandler.liquidationReward(2);
		let reqLiquidation = await wethTokenHandler.requiredLiquidationCollateral(2);
		let tcapBalance = await tcapInstance.balanceOf(accounts[3]);
		let collateralBalance = await wethTokenInstance.balanceOf(accounts[3]);
		let vault = await wethTokenHandler.getVault(2);
		const burnAmount = await wethTokenHandler.getFee(reqLiquidation);
		await expect(
			wethTokenHandler.connect(addr3).liquidateVault(2, reqLiquidation)
		).to.be.revertedWith("Burn fee different than required");
		await expect(
			wethTokenHandler.connect(addr3).liquidateVault(2, 1, {value: burnAmount})
		).to.be.revertedWith("Liquidation amount different than required");
		await expect(
			wethTokenHandler.connect(addr3).liquidateVault(2, reqLiquidation, {value: burnAmount})
		)
			.to.emit(wethTokenHandler, "LogLiquidateVault")
			.withArgs(2, accounts[3], reqLiquidation, liquidationReward);

		vaultRatio = await wethTokenHandler.getVaultRatio(2);
		let newTcapBalance = await tcapInstance.balanceOf(accounts[3]);
		let newCollateralBalance = await wethTokenInstance.balanceOf(accounts[3]);
		let updatedVault = await wethTokenHandler.getVault(2);
		let currentEthBalance = await ethers.provider.getBalance(wethTokenHandler.address);
		expect(ethBalance.add(burnAmount)).to.eq(currentEthBalance);
		expect(updatedVault[1]).to.eq(vault[1].sub(liquidationReward));
		expect(updatedVault[3]).to.eq(vault[3].sub(reqLiquidation));
		expect(newCollateralBalance).to.eq(collateralBalance.add(liquidationReward));
		expect(tcapBalance).to.eq(newTcapBalance.add(reqLiquidation)); //increase earnings
		expect(vaultRatio).to.be.gte(parseInt(ratio)); // set vault back to ratio
	});

	it("...should allow owner to pause contract", async () => {
		await expect(wethTokenHandler.connect(addr1).pause()).to.be.revertedWith(
			"Ownable: caller is not the owner"
		);
		await expect(orchestratorInstance.connect(owner).pauseVault(wethTokenHandler.address))
			.to.emit(wethTokenHandler, "Paused")
			.withArgs(orchestratorInstance.address);
		let paused = await wethTokenHandler.paused();
		expect(paused).to.eq(true);
	});

	it("...shouldn't allow contract calls if contract is paused", async () => {
		await expect(wethTokenHandler.connect(addr1).createVault()).to.be.revertedWith(
			"Pausable: paused"
		);
		await expect(wethTokenHandler.connect(addr1).addCollateral(0)).to.be.revertedWith(
			"Pausable: paused"
		);
		await expect(wethTokenHandler.connect(addr1).mint(0)).to.be.revertedWith("Pausable: paused");
		await expect(wethTokenHandler.connect(addr1).removeCollateral(0)).to.be.revertedWith(
			"Pausable: paused"
		);
	});

	it("...should allow owner to unpause contract", async () => {
		await expect(wethTokenHandler.connect(addr1).unpause()).to.be.revertedWith(
			"Ownable: caller is not the owner"
		);
		await expect(orchestratorInstance.connect(owner).unpauseVault(wethTokenHandler.address))
			.to.emit(wethTokenHandler, "Unpaused")
			.withArgs(orchestratorInstance.address);
		let paused = await wethTokenHandler.paused();
		expect(paused).to.eq(false);
		await expect(wethTokenHandler.connect(addr1).removeCollateral(0))
			.to.emit(wethTokenHandler, "LogRemoveCollateral")
			.withArgs(accounts[1], 1, 0);
	});
});