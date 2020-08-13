var expect = require("chai").expect;
var ethersProvider = require("ethers");

describe("TCAP.x WETH Token Handler", async function () {
	let wethTokenHandler, wethTokenInstance, tcapInstance, tcapOracleInstance, priceOracleInstance;
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
		const TCAPX = await ethers.getContractFactory("TCAPX");
		tcapInstance = await TCAPX.deploy("TCAP.X", "TCAPX", 18);
		await tcapInstance.deployed();
		const wethVault = await ethers.getContractFactory("VaultHandler");
		wethTokenHandler = await wethVault.deploy();
		await wethTokenHandler.deployed();
		expect(wethTokenHandler.address).properAddress;
		const oracle = await ethers.getContractFactory("TcapOracle");
		const collateralOracle = await ethers.getContractFactory("ChainlinkOracle");
		const aggregator = await ethers.getContractFactory("AggregatorInterface");
		let aggregatorInstance = await aggregator.deploy();
		const totalMarketCap = ethersProvider.utils.parseEther("328488279516");
		tcapOracleInstance = await oracle.deploy();
		await tcapOracleInstance.deployed();
		tcapOracleInstance.setLatestAnswer(totalMarketCap);
		priceOracleInstance = await collateralOracle.deploy(aggregatorInstance.address);
		await priceOracleInstance.deployed();
		await tcapInstance.addTokenHandler(wethTokenHandler.address);
		const weth = await ethers.getContractFactory("WETH");
		wethTokenInstance = await weth.deploy();
	});

	it("...should set the tcap.x contract", async () => {
		await expect(wethTokenHandler.connect(addr1).setTCAPXContract(accounts[1])).to.be.revertedWith(
			"Ownable: caller is not the owner"
		);
		await expect(wethTokenHandler.connect(owner).setTCAPXContract(tcapInstance.address))
			.to.emit(wethTokenHandler, "LogSetTCAPXContract")
			.withArgs(accounts[0], tcapInstance.address);
		let currentTCAPX = await wethTokenHandler.TCAPXToken();
		expect(currentTCAPX).to.eq(tcapInstance.address);
	});

	it("...should set the oracle contract", async () => {
		await expect(wethTokenHandler.connect(addr1).setTCAPOracle(accounts[1])).to.be.revertedWith(
			"Ownable: caller is not the owner"
		);
		await expect(wethTokenHandler.connect(owner).setTCAPOracle(tcapOracleInstance.address))
			.to.emit(wethTokenHandler, "LogSetTCAPOracle")
			.withArgs(accounts[0], tcapOracleInstance.address);
		let currentOracle = await wethTokenHandler.tcapOracle();
		expect(currentOracle).to.eq(tcapOracleInstance.address);
	});

	it("...should set the collateral feed oracle", async () => {
		await expect(
			wethTokenHandler.connect(addr1).setCollateralPriceOracle(accounts[1])
		).to.be.revertedWith("Ownable: caller is not the owner");
		await expect(
			wethTokenHandler.connect(owner).setCollateralPriceOracle(priceOracleInstance.address)
		)
			.to.emit(wethTokenHandler, "LogSetCollateralPriceOracle")
			.withArgs(accounts[0], priceOracleInstance.address);
		let currentPriceOracle = await wethTokenHandler.collateralPriceOracle();
		expect(currentPriceOracle).to.eq(priceOracleInstance.address);
	});

	it("...should set the collateral contract", async () => {
		await expect(
			wethTokenHandler.connect(addr1).setCollateralContract(accounts[1])
		).to.be.revertedWith("Ownable: caller is not the owner");
		await expect(wethTokenHandler.connect(owner).setCollateralContract(wethTokenInstance.address))
			.to.emit(wethTokenHandler, "LogSetCollateralContract")
			.withArgs(accounts[0], wethTokenInstance.address);
		let currentCollateral = await wethTokenHandler.collateralContract();
		expect(currentCollateral).to.eq(wethTokenInstance.address);
	});
	it("...should set the divisor value", async () => {
		await expect(wethTokenHandler.connect(addr1).setDivisor(1)).to.be.revertedWith(
			"Ownable: caller is not the owner"
		);
		await expect(wethTokenHandler.connect(owner).setDivisor(divisor))
			.to.emit(wethTokenHandler, "LogSetDivisor")
			.withArgs(accounts[0], divisor);
		let currentDivisor = await wethTokenHandler.divisor();
		expect(currentDivisor).to.eq(divisor);
	});

	it("...should set the collateral ratio", async () => {
		await expect(wethTokenHandler.connect(addr1).setRatio(1)).to.be.revertedWith(
			"Ownable: caller is not the owner"
		);
		await expect(wethTokenHandler.connect(owner).setRatio(ratio))
			.to.emit(wethTokenHandler, "LogSetRatio")
			.withArgs(accounts[0], ratio);
		let currentRatio = await wethTokenHandler.ratio();
		expect(currentRatio).to.eq(ratio);
	});

	it("...should set the burn fee", async () => {
		await expect(wethTokenHandler.connect(addr1).setBurnFee(1)).to.be.revertedWith(
			"Ownable: caller is not the owner"
		);
		await expect(wethTokenHandler.connect(owner).setBurnFee(burnFee))
			.to.emit(wethTokenHandler, "LogSetBurnFee")
			.withArgs(accounts[0], burnFee);
		let currentBurnFee = await wethTokenHandler.burnFee();
		expect(currentBurnFee).to.eq(burnFee);
	});

	it("...should set the liquidation penalty", async () => {
		await expect(wethTokenHandler.connect(addr1).setLiquidationPenalty(0)).to.be.revertedWith(
			"Ownable: caller is not the owner"
		);
		await expect(wethTokenHandler.connect(owner).setLiquidationPenalty(liquidationPenalty))
			.to.emit(wethTokenHandler, "LogSetLiquidationPenalty")
			.withArgs(accounts[0], liquidationPenalty);
		let currentLiquidationPenalty = await wethTokenHandler.liquidationPenalty();
		expect(currentLiquidationPenalty).to.eq(liquidationPenalty);
	});

	it("...should remove the investors requirement flag", async () => {
		let whitelist = await wethTokenHandler.whitelistEnabled();
		expect(whitelist).to.eq(true);
		await expect(wethTokenHandler.connect(addr1).enableWhitelist(false)).to.be.revertedWith(
			"Ownable: caller is not the owner"
		);
		await expect(wethTokenHandler.connect(owner).enableWhitelist(false))
			.to.emit(wethTokenHandler, "LogEnableWhitelist")
			.withArgs(accounts[0], false);
		whitelist = await wethTokenHandler.whitelistEnabled();
		expect(whitelist).to.eq(false);
		await expect(wethTokenHandler.connect(owner).enableWhitelist(true))
			.to.emit(wethTokenHandler, "LogEnableWhitelist")
			.withArgs(accounts[0], true);
	});

	it("...should return the token price", async () => {
		let tcapxPrice = await wethTokenHandler.TCAPXPrice();
		let totalMarketCap = await tcapOracleInstance.getLatestAnswer();
		let result = totalMarketCap.div(divisor);
		expect(tcapxPrice).to.eq(result);
	});

	it("...should allow owner to add investor to whitelist", async () => {
		await expect(wethTokenHandler.connect(addr1).addInvestor(accounts[1])).to.be.revertedWith(
			"Ownable: caller is not the owner"
		);
		await expect(wethTokenHandler.connect(owner).addInvestor(accounts[1]))
			.to.emit(wethTokenHandler, "RoleGranted")
			.withArgs(
				ethersProvider.utils.keccak256(ethersProvider.utils.toUtf8Bytes("INVESTOR_ROLE")),
				accounts[1],
				accounts[0]
			);
		await expect(wethTokenHandler.connect(owner).addInvestor(accounts[2]))
			.to.emit(wethTokenHandler, "RoleGranted")
			.withArgs(
				ethersProvider.utils.keccak256(ethersProvider.utils.toUtf8Bytes("INVESTOR_ROLE")),
				accounts[2],
				accounts[0]
			);
		await expect(wethTokenHandler.connect(owner).addInvestor(accounts[3]))
			.to.emit(wethTokenHandler, "RoleGranted")
			.withArgs(
				ethersProvider.utils.keccak256(ethersProvider.utils.toUtf8Bytes("INVESTOR_ROLE")),
				accounts[3],
				accounts[0]
			);
	});

	it("...should allow owner to remove investor from whitelist", async () => {
		await expect(wethTokenHandler.connect(addr1).removeInvestor(accounts[0])).to.be.revertedWith(
			"Ownable: caller is not the owner"
		);
		await expect(wethTokenHandler.connect(owner).removeInvestor(accounts[2]))
			.to.emit(wethTokenHandler, "RoleRevoked")
			.withArgs(
				ethersProvider.utils.keccak256(ethersProvider.utils.toUtf8Bytes("INVESTOR_ROLE")),
				accounts[2],
				accounts[0]
			);
	});

	it("...should allow investor to create a vault", async () => {
		let vaultId = await wethTokenHandler.vaultToUser(accounts[1]);
		expect(vaultId).eq(0);
		await expect(wethTokenHandler.connect(addr1).createVault())
			.to.emit(wethTokenHandler, "LogCreateVault")
			.withArgs(accounts[1], 1);
		vaultId = await wethTokenHandler.vaultToUser(accounts[1]);
		expect(vaultId).eq(1);
		await expect(wethTokenHandler.connect(addr2).createVault()).to.be.revertedWith(
			"Caller is not investor"
		);
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

	it("...should allow investor to stake collateral", async () => {
		const amount = ethersProvider.utils.parseEther("375");
		await expect(wethTokenHandler.connect(addr2).addCollateral(amount)).to.be.revertedWith(
			"Caller is not investor"
		);
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

	it("...should allow investor to retrieve unused collateral", async () => {
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
		const tcapPrice = await wethTokenHandler.TCAPXPrice();
		const ratio = await wethTokenHandler.ratio();
		let result = tcapPrice.mul(amount).mul(ratio).div(100).div(ethPrice);
		expect(reqAmount).to.eq(result);
	});

	it("...should allow investors to mint tokens", async () => {
		const amount = ethersProvider.utils.parseEther("10");
		const amount2 = ethersProvider.utils.parseEther("11");
		const lowAmount = ethersProvider.utils.parseEther("1");
		const bigAmount = ethersProvider.utils.parseEther("100");
		const reqAmount2 = await wethTokenHandler.requiredCollateral(amount2);

		await wethTokenInstance.mint(accounts[1], reqAmount2);
		let tcapxBalance = await tcapInstance.balanceOf(accounts[1]);
		expect(tcapxBalance).to.eq(0);
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
		tcapxBalance = await tcapInstance.balanceOf(accounts[1]);
		expect(tcapxBalance).to.eq(amount);
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

	it("...shouln't allow investors to retrieve stake unless debt is paid", async () => {
		let vault = await wethTokenHandler.getVault(1);
		await expect(wethTokenHandler.connect(addr1).removeCollateral(vault[1])).to.be.revertedWith(
			"Collateral below min required ratio"
		);
	});

	it("...should calculate the burn fee", async () => {
		let amount = ethersProvider.utils.parseEther("10");
		let divisor = 100;
		let tcapPrice = await wethTokenHandler.TCAPXPrice();
		let ethPrice = await priceOracleInstance.getLatestAnswer();
		let result = tcapPrice.mul(amount).div(divisor).div(ethPrice);
		let fee = await wethTokenHandler.getFee(amount);
		expect(fee).to.eq(result);
		amount = ethersProvider.utils.parseEther("100");
		result = tcapPrice.mul(amount).div(divisor).div(ethPrice);
		fee = await wethTokenHandler.getFee(amount);
		expect(fee).to.eq(result);
	});

	it("...should allow investors to burn tokens", async () => {
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
		let tcapxBalance = await tcapInstance.balanceOf(accounts[1]);
		expect(tcapxBalance).to.eq(0);
		vault = await wethTokenHandler.getVault(1);
		expect(vault[0]).to.eq(1);
		expect(vault[1]).to.eq(reqAmount2);
		expect(vault[2]).to.eq(accounts[1]);
		expect(vault[3]).to.eq(0);

		let ethBalance = await ethers.provider.getBalance(wethTokenHandler.address);
		expect(ethBalance).to.eq(ethAmount);
	});

	it("...should update change the collateral ratio", async () => {
		let ratio = await wethTokenHandler.getVaultRatio(1);
		expect(ratio).to.eq(0);
	});

	it("...should allow investors to retrieve stake when debt is paid", async () => {
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
		await expect(wethTokenHandler.connect(addr3).retrieveFees()).to.be.revertedWith(
			"Ownable: caller is not the owner"
		);
		await expect(wethTokenHandler.connect(owner).retrieveFees())
			.to.emit(wethTokenHandler, "LogRetrieveFees")
			.withArgs(accounts[0], ethBalance);
		let currentAccountBalance = await ethers.provider.getBalance(accounts[0]);
		expect(currentAccountBalance).to.gt(accountBalance);
		ethBalance = await ethers.provider.getBalance(wethTokenHandler.address);
		expect(ethBalance).to.eq(0);
	});

	it("...should test liquidation requirements", async () => {
		//Prepare for liquidation tests
		let amount = ethersProvider.utils.parseEther("10");

		const reqAmount = await wethTokenHandler.requiredCollateral(
			ethersProvider.utils.parseEther("11")
		);

		//liquidated
		await wethTokenHandler.connect(owner).addInvestor(accounts[4]);
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
		const totalMarketCap = ethersProvider.utils.parseEther("368488279516");
		await tcapOracleInstance.connect(owner).setLatestAnswer(totalMarketCap);
	});

	it("...should get the required collateral for liquidation", async () => {
		let reqLiquidation = await wethTokenHandler.requiredLiquidationCollateral(2);
		let liquidationPenalty = await wethTokenHandler.liquidationPenalty();
		let ratio = await wethTokenHandler.ratio();
		let collateralPrice = await priceOracleInstance.getLatestAnswer();
		let tcapPrice = await wethTokenHandler.TCAPXPrice();
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
		let tcapPrice = await wethTokenHandler.TCAPXPrice();

		let result = reqLiquidation.mul(liquidationPenalty.add(100)).div(100);
		result = result.mul(tcapPrice).div(collateralPrice);
		expect(result).to.eq(liquidationReward);
	});

	it("...should allow liquidators to return profits", async () => {
		const divisor = ethersProvider.utils.parseEther("1");
		const liquidationReward = await wethTokenHandler.liquidationReward(2);
		const reqLiquidation = await wethTokenHandler.requiredLiquidationCollateral(2);
		const tcapPrice = await wethTokenHandler.TCAPXPrice();
		const collateralPrice = await priceOracleInstance.getLatestAnswer();
		const rewardUSD = liquidationReward.mul(collateralPrice).div(divisor);
		const collateralUSD = reqLiquidation.mul(tcapPrice).div(divisor);
		expect(rewardUSD).to.be.gte(
			collateralUSD,
			"reward should be greater than collateral paid to liquidate"
		);
	});
	it("...should allow users to liquidate investors on vault ratio less than ratio", async () => {
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
});
