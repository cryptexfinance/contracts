var expect = require("chai").expect;
var ethersProvider = require("ethers");

describe("ERC20 Vault", async function () {
	let ercTokenHandler,
		ercTokenInstance,
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
		const ercVault = await ethers.getContractFactory("ERC20VaultHandler");
		ercTokenHandler = await ercVault.deploy(orchestratorInstance.address);
		await ercTokenHandler.deployed();
		expect(ercTokenHandler.address).properAddress;
		const collateralOracle = await ethers.getContractFactory("ChainlinkOracle");
		const oracle = await ethers.getContractFactory("ChainlinkOracle");
		const aggregator = await ethers.getContractFactory("AggregatorInterface");
		const aggregatorTcap = await ethers.getContractFactory("AggregatorInterfaceTCAP");
		let aggregatorInstance = await aggregator.deploy();
		aggregatorTCAPInstance = await aggregatorTcap.deploy();
		priceOracleInstance = await collateralOracle.deploy(aggregatorInstance.address);
		tcapOracleInstance = await oracle.deploy(aggregatorTCAPInstance.address);
		await priceOracleInstance.deployed();
		await orchestratorInstance.addTCAPVault(tcapInstance.address, ercTokenHandler.address);
		const wbtc = await ethers.getContractFactory("WBTC");
		ercTokenInstance = await wbtc.deploy();

		// Initialize Vault

		await orchestratorInstance.initializeVault(
			ercTokenHandler.address,
			divisor,
			ratio,
			burnFee,
			liquidationPenalty,
			tcapOracleInstance.address,
			tcapInstance.address,
			ercTokenInstance.address,
			priceOracleInstance.address,
			priceOracleInstance.address
		);
	});

	it("...should return the token price", async () => {
		let tcapPrice = await ercTokenHandler.TCAPPrice();
		let totalMarketCap = await tcapOracleInstance.getLatestAnswer();
		let result = totalMarketCap.mul(10000000000).div(divisor);
		expect(tcapPrice).to.eq(result);
	});

	it("...should allow users to create a vault", async () => {
		let vaultId = await ercTokenHandler.vaultToUser(accounts[1]);
		expect(vaultId).eq(0);
		await expect(ercTokenHandler.connect(addr1).createVault())
			.to.emit(ercTokenHandler, "LogCreateVault")
			.withArgs(accounts[1], 1);
		vaultId = await ercTokenHandler.vaultToUser(accounts[1]);
		expect(vaultId).eq(1);
		vaultId = await ercTokenHandler.vaultToUser(accounts[2]);
		expect(vaultId).eq(0);
		await expect(ercTokenHandler.connect(addr1).createVault()).to.be.revertedWith(
			"Vault already created"
		);
	});

	it("...should get vault by id", async () => {
		let vault = await ercTokenHandler.getVault(1);
		expect(vault[0]).to.eq(1);
		expect(vault[1]).to.eq(0);
		expect(vault[2]).to.eq(accounts[1]);
		expect(vault[3]).to.eq(0);
		vault = await ercTokenHandler.getVault(100);
		expect(vault[0]).to.eq(0);
		expect(vault[1]).to.eq(0);
		expect(vault[2]).to.eq(ethersProvider.constants.AddressZero);
		expect(vault[3]).to.eq(0);
	});

	it("...should allow user to stake collateral", async () => {
		const amount = ethersProvider.utils.parseEther("375");
		await expect(ercTokenHandler.connect(addr3).addCollateral(amount)).to.be.revertedWith(
			"No Vault created"
		);
		let balance = await ercTokenInstance.balanceOf(accounts[1]);
		expect(balance).to.eq(0);

		await expect(ercTokenHandler.connect(addr1).addCollateral(amount)).to.be.revertedWith(
			"ERC20: transfer amount exceeds balance"
		);
		await ercTokenInstance.mint(accounts[1], amount);
		await expect(ercTokenHandler.connect(addr1).addCollateral(amount)).to.be.revertedWith(
			"ERC20: transfer amount exceeds allowance"
		);
		await ercTokenInstance.connect(addr1).approve(ercTokenHandler.address, amount);
		balance = await ercTokenInstance.balanceOf(accounts[1]);
		expect(balance).to.eq(amount);

		await expect(ercTokenHandler.connect(addr1).addCollateral(0)).to.be.revertedWith(
			"Value can't be 0"
		);

		await expect(ercTokenHandler.connect(addr1).addCollateral(amount))
			.to.emit(ercTokenHandler, "LogAddCollateral")
			.withArgs(accounts[1], 1, amount);
		let vault = await ercTokenHandler.getVault(1);
		expect(vault[0]).to.eq(1);
		expect(vault[1]).to.eq(amount);
		expect(vault[2]).to.eq(accounts[1]);
		expect(vault[3]).to.eq(0);
		balance = await ercTokenInstance.balanceOf(accounts[1]);
		expect(balance).to.eq(0);
		balance = await ercTokenInstance.balanceOf(ercTokenHandler.address);
		expect(balance).to.eq(amount);
		await ercTokenInstance.mint(accounts[1], amount);
		await ercTokenInstance.connect(addr1).approve(ercTokenHandler.address, amount);
		await ercTokenHandler.connect(addr1).addCollateral(amount);
		vault = await ercTokenHandler.getVault(1);
		expect(vault[0]).to.eq(1);
		expect(vault[1]).to.eq(amount.add(amount));
		expect(vault[2]).to.eq(accounts[1]);
		expect(vault[3]).to.eq(0);
		balance = await ercTokenInstance.balanceOf(ercTokenHandler.address);
		expect(balance).to.eq(amount.add(amount));
	});

	it("...should allow user to retrieve unused collateral", async () => {
		const amount = ethersProvider.utils.parseEther("375");
		const bigAmount = ethersProvider.utils.parseEther("100375");
		let balance = await ercTokenInstance.balanceOf(accounts[1]);
		expect(balance).to.eq(0);

		await expect(ercTokenHandler.connect(addr3).removeCollateral(amount)).to.be.revertedWith(
			"No Vault created"
		);
		await expect(ercTokenHandler.connect(addr1).removeCollateral(bigAmount)).to.be.revertedWith(
			"Retrieve amount higher than collateral"
		);
		await expect(ercTokenHandler.connect(addr1).removeCollateral(0)).to.be.revertedWith(
			"Value can't be 0"
		);
		await expect(ercTokenHandler.connect(addr1).removeCollateral(amount))
			.to.emit(ercTokenHandler, "LogRemoveCollateral")
			.withArgs(accounts[1], 1, amount);

		let vault = await ercTokenHandler.getVault(1);
		expect(vault[0]).to.eq(1);
		expect(vault[1]).to.eq(amount);
		expect(vault[2]).to.eq(accounts[1]);
		expect(vault[3]).to.eq(0);
		balance = await ercTokenInstance.balanceOf(accounts[1]);
		expect(balance).to.eq(amount);
		balance = await ercTokenInstance.balanceOf(ercTokenHandler.address);
		expect(balance).to.eq(amount);
		await ercTokenHandler.connect(addr1).removeCollateral(amount);
		vault = await ercTokenHandler.getVault(1);
		expect(vault[0]).to.eq(1);
		expect(vault[1]).to.eq(0);
		expect(vault[2]).to.eq(accounts[1]);
		expect(vault[3]).to.eq(0);
		balance = await ercTokenInstance.balanceOf(accounts[1]);
		expect(balance).to.eq(amount.add(amount));
		balance = await ercTokenInstance.balanceOf(ercTokenHandler.address);
		expect(balance).to.eq(0);
	});

	it("...should return the correct minimal collateral required", async () => {
		let amount = ethersProvider.utils.parseEther("1");
		const reqAmount = await ercTokenHandler.requiredCollateral(amount);
		const ethPrice = await priceOracleInstance.getLatestAnswer();
		const tcapPrice = await ercTokenHandler.TCAPPrice();
		const ratio = await ercTokenHandler.ratio();
		let result = tcapPrice.mul(amount).mul(ratio).div(100).div(ethPrice.mul(10000000000));
		expect(reqAmount).to.eq(result);
	});

	it("...should allow user to mint tokens", async () => {
		const amount = ethersProvider.utils.parseEther("10");
		const amount2 = ethersProvider.utils.parseEther("11");
		const lowAmount = ethersProvider.utils.parseEther("1");
		const bigAmount = ethersProvider.utils.parseEther("100");
		const reqAmount2 = await ercTokenHandler.requiredCollateral(amount2);

		await ercTokenInstance.mint(accounts[1], reqAmount2);
		let tcapBalance = await tcapInstance.balanceOf(accounts[1]);
		expect(tcapBalance).to.eq(0);
		await ercTokenInstance.connect(addr1).approve(ercTokenHandler.address, reqAmount2);
		await ercTokenHandler.connect(addr1).addCollateral(reqAmount2);
		await expect(ercTokenHandler.connect(addr3).mint(amount)).to.be.revertedWith(
			"No Vault created"
		);
		await expect(ercTokenHandler.connect(addr1).mint(bigAmount)).to.be.revertedWith(
			"Not enough collateral"
		);
		await expect(ercTokenHandler.connect(addr1).mint(0)).to.be.revertedWith("Value can't be 0");
		await expect(ercTokenHandler.connect(addr1).mint(amount))
			.to.emit(ercTokenHandler, "LogMint")
			.withArgs(accounts[1], 1, amount);
		tcapBalance = await tcapInstance.balanceOf(accounts[1]);
		expect(tcapBalance).to.eq(amount);
		vault = await ercTokenHandler.getVault(1);
		expect(vault[0]).to.eq(1);
		expect(vault[1]).to.eq(reqAmount2);
		expect(vault[2]).to.eq(accounts[1]);
		expect(vault[3]).to.eq(amount);
		await expect(ercTokenHandler.connect(addr1).mint(lowAmount)).to.be.revertedWith(
			"Collateral below min required ratio"
		);
	});

	it("...should allow token transfers", async () => {
		let tcapBalance = await tcapInstance.balanceOf(accounts[1]);
		await tcapInstance.connect(addr1).transfer(accounts[2], tcapBalance);
		expect(await tcapInstance.balanceOf(accounts[1])).to.eq(0);
		expect(await tcapInstance.balanceOf(accounts[2])).to.eq(tcapBalance);
		await tcapInstance.connect(addr2).transfer(accounts[1], tcapBalance);
		expect(await tcapInstance.balanceOf(accounts[2])).to.eq(0);
		expect(await tcapInstance.balanceOf(accounts[1])).to.eq(tcapBalance);
	});
	it("...shouldn't allow user to send tokens to tcap contract", async () => {
		let tcapBalance = await tcapInstance.balanceOf(accounts[1]);
		await expect(
			tcapInstance.connect(addr1).transfer(tcapInstance.address, tcapBalance)
		).to.be.revertedWith("Can't transfer to TCAP contract");
	});

	it("...should allow users to get collateral ratio", async () => {
		let ratio = await ercTokenHandler.getVaultRatio(2);
		expect(ratio).to.eq(0);
		ratio = await ercTokenHandler.getVaultRatio(1);
		expect(ratio).to.eq(164);
	});

	it("...shouln't allow users to retrieve stake unless debt is paid", async () => {
		let vault = await ercTokenHandler.getVault(1);
		await expect(ercTokenHandler.connect(addr1).removeCollateral(vault[1])).to.be.revertedWith(
			"Collateral below min required ratio"
		);
	});

	it("...should calculate the burn fee", async () => {
		let amount = ethersProvider.utils.parseEther("10");
		let divisor = 100;
		let tcapPrice = await ercTokenHandler.TCAPPrice();
		let ethPrice = (await priceOracleInstance.getLatestAnswer()).mul(10000000000);
		let result = tcapPrice.mul(amount).div(divisor).div(ethPrice);
		let fee = await ercTokenHandler.getFee(amount);
		expect(fee).to.eq(result);
		amount = ethersProvider.utils.parseEther("100");
		result = tcapPrice.mul(amount).div(divisor).div(ethPrice);
		fee = await ercTokenHandler.getFee(amount);
		expect(fee).to.eq(result);
	});

	it("...should allow users to burn tokens", async () => {
		const amount = ethersProvider.utils.parseEther("10");
		const amount2 = ethersProvider.utils.parseEther("11");
		const bigAmount = ethersProvider.utils.parseEther("100");
		const ethHighAmount = ethersProvider.utils.parseEther("50");
		const reqAmount2 = await ercTokenHandler.requiredCollateral(amount2);
		const ethAmount = await ercTokenHandler.getFee(amount);
		const ethAmount2 = await ercTokenHandler.getFee(bigAmount);

		await expect(ercTokenHandler.connect(addr3).burn(amount)).to.be.revertedWith(
			"No Vault created"
		);
		await expect(ercTokenHandler.connect(addr1).burn(amount)).to.be.revertedWith(
			"Burn fee different than required"
		);
		await expect(
			ercTokenHandler.connect(addr1).burn(bigAmount, {value: ethAmount2})
		).to.be.revertedWith("Amount greater than debt");
		await expect(
			ercTokenHandler.connect(addr1).burn(amount, {value: ethHighAmount})
		).to.be.revertedWith("Burn fee different than required");
		await expect(ercTokenHandler.connect(addr1).burn(0)).to.be.revertedWith("Value can't be 0");
		await expect(ercTokenHandler.connect(addr1).burn(amount, {value: ethAmount}))
			.to.emit(ercTokenHandler, "LogBurn")
			.withArgs(accounts[1], 1, amount);
		let tcapBalance = await tcapInstance.balanceOf(accounts[1]);
		expect(tcapBalance).to.eq(0);
		vault = await ercTokenHandler.getVault(1);
		expect(vault[0]).to.eq(1);
		expect(vault[1]).to.eq(reqAmount2);
		expect(vault[2]).to.eq(accounts[1]);
		expect(vault[3]).to.eq(0);

		let ethBalance = await ethers.provider.getBalance(ercTokenHandler.address);
		expect(ethBalance).to.eq(ethAmount);
	});

	it("...should update the collateral ratio", async () => {
		let ratio = await ercTokenHandler.getVaultRatio(1);
		expect(ratio).to.eq(0);
	});

	it("...should allow users to retrieve stake when debt is paid", async () => {
		let vault = await ercTokenHandler.getVault(1);
		await expect(ercTokenHandler.connect(addr1).removeCollateral(vault[1]))
			.to.emit(ercTokenHandler, "LogRemoveCollateral")
			.withArgs(accounts[1], 1, vault[1]);
		vault = await ercTokenHandler.getVault(1);
		expect(vault[0]).to.eq(1);
		expect(vault[1]).to.eq(0);
		expect(vault[2]).to.eq(accounts[1]);
		expect(vault[3]).to.eq(0);
	});

	it("...should allow owner to retrieve fees in the contract", async () => {
		let ethBalance = await ethers.provider.getBalance(ercTokenHandler.address);
		let accountBalance = await ethers.provider.getBalance(accounts[0]);
		let orchestratorBalance = await ethers.provider.getBalance(orchestratorInstance.address);
		await expect(ercTokenHandler.connect(addr3).retrieveFees()).to.be.revertedWith(
			"Ownable: caller is not the owner"
		);
		await expect(orchestratorInstance.connect(owner).retrieveVaultFees(ercTokenHandler.address))
			.to.emit(ercTokenHandler, "LogRetrieveFees")
			.withArgs(orchestratorInstance.address, ethBalance);
		let currentAccountBalance = await ethers.provider.getBalance(orchestratorInstance.address);
		expect(currentAccountBalance).to.eq(orchestratorBalance.add(ethBalance));
		await orchestratorInstance.connect(owner).retrieveFees();
		currentAccountBalance = await ethers.provider.getBalance(accounts[0]);
		expect(currentAccountBalance).to.gt(accountBalance);
		ethBalance = await ethers.provider.getBalance(ercTokenHandler.address);
		expect(ethBalance).to.eq(0);
		ethBalance = await ethers.provider.getBalance(orchestratorInstance.address);
		expect(ethBalance).to.eq(0);
	});

	it("...should test liquidation requirements", async () => {
		//Prepare for liquidation tests
		let amount = ethersProvider.utils.parseEther("10");

		const reqAmount = await ercTokenHandler.requiredCollateral(
			ethersProvider.utils.parseEther("11")
		);

		//liquidated
		await ercTokenHandler.connect(lq).createVault();
		await ercTokenInstance.mint(accounts[4], reqAmount);
		await ercTokenInstance.connect(lq).approve(ercTokenHandler.address, reqAmount);
		await ercTokenHandler.connect(lq).addCollateral(reqAmount);
		await ercTokenHandler.connect(lq).mint(amount);
		await expect(ercTokenHandler.connect(addr3).liquidateVault(99, 0)).to.be.revertedWith(
			"No Vault created"
		);
		await expect(ercTokenHandler.connect(addr3).liquidateVault(2, 0)).to.be.revertedWith(
			"Vault is not liquidable"
		);
		const totalMarketCap = "43129732288636297500";
		await aggregatorTCAPInstance.connect(owner).setLatestAnswer(totalMarketCap);
	});

	it("...should get the required collateral for liquidation", async () => {
		let reqLiquidation = await ercTokenHandler.requiredLiquidationCollateral(2);
		let liquidationPenalty = await ercTokenHandler.liquidationPenalty();
		let ratio = await ercTokenHandler.ratio();
		let collateralPrice = (await priceOracleInstance.getLatestAnswer()).mul(10000000000);
		let tcapPrice = await ercTokenHandler.TCAPPrice();
		let vault = await ercTokenHandler.getVault(2);
		let collateralTcap = vault[1].mul(collateralPrice).div(tcapPrice);
		let reqDividend = vault[3].mul(ratio).div(100).sub(collateralTcap).mul(100);
		let reqDivisor = ratio.sub(liquidationPenalty.add(100));
		let result = reqDividend.div(reqDivisor);
		expect(result).to.eq(reqLiquidation);
	});

	it("...should get the liquidation reward", async () => {
		let reqLiquidation = await ercTokenHandler.requiredLiquidationCollateral(2);
		let liquidationReward = await ercTokenHandler.liquidationReward(2);
		let liquidationPenalty = await ercTokenHandler.liquidationPenalty();
		let collateralPrice = (await priceOracleInstance.getLatestAnswer()).mul(10000000000);
		let tcapPrice = await ercTokenHandler.TCAPPrice();

		let result = reqLiquidation.mul(liquidationPenalty.add(100)).div(100);
		result = result.mul(tcapPrice).div(collateralPrice);
		expect(result).to.eq(liquidationReward);
	});

	it("...should allow liquidators to return profits", async () => {
		const divisor = ethersProvider.utils.parseEther("1");
		const liquidationReward = await ercTokenHandler.liquidationReward(2);
		const reqLiquidation = await ercTokenHandler.requiredLiquidationCollateral(2);
		const tcapPrice = await ercTokenHandler.TCAPPrice();
		const collateralPrice = (await priceOracleInstance.getLatestAnswer()).mul(10000000000);
		const rewardUSD = liquidationReward.mul(collateralPrice).div(divisor);
		const collateralUSD = reqLiquidation.mul(tcapPrice).div(divisor);
		expect(rewardUSD).to.be.gte(
			collateralUSD,
			"reward should be greater than collateral paid to liquidate"
		);
	});
	it("...should allow users to liquidate users on vault ratio less than ratio", async () => {
		let vaultRatio = await ercTokenHandler.getVaultRatio(2);
		let ethBalance = await ethers.provider.getBalance(ercTokenHandler.address);

		//liquidator setup
		let liquidatorAmount = ethersProvider.utils.parseEther("20");
		const reqLiquidatorAmount = await ercTokenHandler.requiredCollateral(
			ethersProvider.utils.parseEther("110")
		);
		await ercTokenHandler.connect(addr3).createVault();
		await ercTokenInstance.mint(accounts[3], reqLiquidatorAmount);
		await ercTokenInstance.connect(addr3).approve(ercTokenHandler.address, reqLiquidatorAmount);
		await ercTokenHandler.connect(addr3).addCollateral(reqLiquidatorAmount);
		await ercTokenHandler.connect(addr3).mint(liquidatorAmount);

		let liquidationReward = await ercTokenHandler.liquidationReward(2);
		let reqLiquidation = await ercTokenHandler.requiredLiquidationCollateral(2);
		let tcapBalance = await tcapInstance.balanceOf(accounts[3]);
		let collateralBalance = await ercTokenInstance.balanceOf(accounts[3]);
		let vault = await ercTokenHandler.getVault(2);
		const burnAmount = await ercTokenHandler.getFee(reqLiquidation);
		await expect(
			ercTokenHandler.connect(addr3).liquidateVault(2, reqLiquidation)
		).to.be.revertedWith("Burn fee different than required");
		await expect(
			ercTokenHandler.connect(addr3).liquidateVault(2, 1, {value: burnAmount})
		).to.be.revertedWith("Liquidation amount different than required");
		await expect(
			ercTokenHandler.connect(addr3).liquidateVault(2, reqLiquidation, {value: burnAmount})
		)
			.to.emit(ercTokenHandler, "LogLiquidateVault")
			.withArgs(2, accounts[3], reqLiquidation, liquidationReward);

		vaultRatio = await ercTokenHandler.getVaultRatio(2);
		let newTcapBalance = await tcapInstance.balanceOf(accounts[3]);
		let newCollateralBalance = await ercTokenInstance.balanceOf(accounts[3]);
		let updatedVault = await ercTokenHandler.getVault(2);
		let currentEthBalance = await ethers.provider.getBalance(ercTokenHandler.address);
		expect(ethBalance.add(burnAmount)).to.eq(currentEthBalance);
		expect(updatedVault[1]).to.eq(vault[1].sub(liquidationReward));
		expect(updatedVault[3]).to.eq(vault[3].sub(reqLiquidation));
		expect(newCollateralBalance).to.eq(collateralBalance.add(liquidationReward));
		expect(tcapBalance).to.eq(newTcapBalance.add(reqLiquidation)); //increase earnings
		expect(vaultRatio).to.be.gte(parseInt(ratio)); // set vault back to ratio
	});

	it("...should allow owner to pause contract", async () => {
		await expect(ercTokenHandler.connect(addr1).pause()).to.be.revertedWith(
			"Ownable: caller is not the owner"
		);
		await expect(orchestratorInstance.connect(owner).pauseVault(ercTokenHandler.address))
			.to.emit(ercTokenHandler, "Paused")
			.withArgs(orchestratorInstance.address);
		let paused = await ercTokenHandler.paused();
		expect(paused).to.eq(true);
	});

	it("...shouldn't allow contract calls if contract is paused", async () => {
		await expect(ercTokenHandler.connect(addr1).createVault()).to.be.revertedWith(
			"Pausable: paused"
		);
		await expect(ercTokenHandler.connect(addr1).addCollateral(0)).to.be.revertedWith(
			"Pausable: paused"
		);
		await expect(ercTokenHandler.connect(addr1).mint(0)).to.be.revertedWith("Pausable: paused");
		await expect(ercTokenHandler.connect(addr1).removeCollateral(0)).to.be.revertedWith(
			"Pausable: paused"
		);
	});

	it("...should allow owner to unpause contract", async () => {
		await expect(ercTokenHandler.connect(addr1).unpause()).to.be.revertedWith(
			"Ownable: caller is not the owner"
		);
		await expect(orchestratorInstance.connect(owner).unpauseVault(ercTokenHandler.address))
			.to.emit(ercTokenHandler, "Unpaused")
			.withArgs(orchestratorInstance.address);
		let paused = await ercTokenHandler.paused();
		expect(paused).to.eq(false);
	});
});
