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
	let [owner, addr1, addr2, addr3, lq, guardian, treasury] = [];
	let accounts = [];
	let divisor = "10000000000";
	let ratio = "150";
	let burnFee = "1";
	let liquidationPenalty = "10";

	before("Set Accounts", async () => {
		let [acc0, acc1, acc3, acc4, acc5, acc6, acc7] = await ethers.getSigners();
		owner = acc0;
		addr1 = acc1;
		addr2 = acc3;
		addr3 = acc4;
		treasury = acc7;
		lq = acc5;
		guardian = acc6;
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
		orchestratorInstance = await orchestrator.deploy(await guardian.getAddress());
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
		const collateralOracle = await ethers.getContractFactory("ChainlinkOracle");
		const oracle = await ethers.getContractFactory("ChainlinkOracle");
		const aggregator = await ethers.getContractFactory("AggregatorInterface");
		const aggregatorTcap = await ethers.getContractFactory("AggregatorInterfaceTCAP");
		let aggregatorInstance = await aggregator.deploy();
		aggregatorTCAPInstance = await aggregatorTcap.deploy();
		priceOracleInstance = await collateralOracle.deploy(aggregatorInstance.address);
		tcapOracleInstance = await oracle.deploy(aggregatorTCAPInstance.address);
		await priceOracleInstance.deployed();

		const wbtc = await ethers.getContractFactory("WBTC");
		ercTokenInstance = await wbtc.deploy();

		// Initialize Vault

		const ercVault = await ethers.getContractFactory("ERC20VaultHandler");
		ercTokenHandler = await ercVault.deploy(
			orchestratorInstance.address,
			divisor,
			ratio,
			burnFee,
			liquidationPenalty,
			tcapOracleInstance.address,
			tcapInstance.address,
			ercTokenInstance.address,
			priceOracleInstance.address,
			priceOracleInstance.address,
			ethers.constants.AddressZero,
			ethers.constants.AddressZero
		);
		await ercTokenHandler.deployed();
		expect(ercTokenHandler.address).properAddress;

		await orchestratorInstance.addTCAPVault(tcapInstance.address, ercTokenHandler.address);
	});

	it("...should allow the owner to set the treasury address", async () => {
		const abi = new ethers.utils.AbiCoder();
		const target = ercTokenHandler.address;
		const value = 0;
		const signature = "setTreasury(address)";
		const treasuryAddress = await treasury.getAddress();
		const data = abi.encode(["address"], [treasuryAddress]);
		await expect(
			orchestratorInstance.connect(owner).executeTransaction(target, value, signature, data)
		)
			.to.emit(ercTokenHandler, "NewTreasury")
			.withArgs(orchestratorInstance.address, treasuryAddress);

		expect(await ercTokenHandler.treasury()).to.eq(treasuryAddress);
	});

	it("...should return the token price", async () => {
		let tcapPrice = await ercTokenHandler.TCAPPrice();
		let totalMarketCap = await tcapOracleInstance.getLatestAnswer();
		let result = totalMarketCap.mul(10000000000).div(divisor);
		expect(tcapPrice).to.eq(result);
	});

	it("...should allow users to create a vault", async () => {
		let vaultId = await ercTokenHandler.userToVault(accounts[1]);
		expect(vaultId).eq(0);
		await expect(ercTokenHandler.connect(addr1).createVault())
			.to.emit(ercTokenHandler, "VaultCreated")
			.withArgs(accounts[1], 1);
		vaultId = await ercTokenHandler.userToVault(accounts[1]);
		expect(vaultId).eq(1);
		vaultId = await ercTokenHandler.userToVault(accounts[2]);
		expect(vaultId).eq(0);
		await expect(ercTokenHandler.connect(addr1).createVault()).to.be.revertedWith(
			"VaultHandler::createVault: vault already created"
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
			"VaultHandler::vaultExists: no vault created"
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
			"VaultHandler::notZero: value can't be 0"
		);

		await expect(ercTokenHandler.connect(addr1).addCollateral(amount))
			.to.emit(ercTokenHandler, "CollateralAdded")
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
			"VaultHandler::vaultExists: no vault created"
		);
		await expect(ercTokenHandler.connect(addr1).removeCollateral(bigAmount)).to.be.revertedWith(
			"VaultHandler::removeCollateral: retrieve amount higher than collateral"
		);
		await expect(ercTokenHandler.connect(addr1).removeCollateral(0)).to.be.revertedWith(
			"VaultHandler::notZero: value can't be 0"
		);
		await expect(ercTokenHandler.connect(addr1).removeCollateral(amount))
			.to.emit(ercTokenHandler, "CollateralRemoved")
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

	it("...shouldn't allow minting above cap", async () => {
		const amount = ethersProvider.utils.parseEther("11");
		const reqAmount = await ercTokenHandler.requiredCollateral(amount);

		await ercTokenInstance.mint(accounts[1], reqAmount);
		await ercTokenInstance.connect(addr1).approve(ercTokenHandler.address, reqAmount);
		await ercTokenHandler.connect(addr1).addCollateral(reqAmount);

		//Shouldn't allow to mint above cap
		let enableCap = true;
		let enableHash = ethers.utils.solidityKeccak256(["bool"], [enableCap]);

		let tcapCap = 1;
		await orchestratorInstance.enableTCAPCap(tcapInstance.address, enableCap);
		await orchestratorInstance.setTCAPCap(tcapInstance.address, tcapCap);
		await expect(ercTokenHandler.connect(addr1).mint(reqAmount)).to.be.revertedWith(
			"TCAP::Transfer: TCAP cap exceeded"
		);
		// Remove Cap
		enableCap = false;
		await orchestratorInstance.enableTCAPCap(tcapInstance.address, enableCap);
	});

	it("...should allow user to mint tokens", async () => {
		const amount = ethersProvider.utils.parseEther("10");
		const lowAmount = ethersProvider.utils.parseEther("1");
		const bigAmount = ethersProvider.utils.parseEther("100");
		const amount2 = ethersProvider.utils.parseEther("11");
		const reqAmount2 = await ercTokenHandler.requiredCollateral(amount2);

		let tcapBalance = await tcapInstance.balanceOf(accounts[1]);
		expect(tcapBalance).to.eq(0);
		await expect(ercTokenHandler.connect(addr3).mint(amount)).to.be.revertedWith(
			"VaultHandler::vaultExists: no vault created"
		);
		await expect(ercTokenHandler.connect(addr1).mint(bigAmount)).to.be.revertedWith(
			"VaultHandler::mint: not enough collateral"
		);
		await expect(ercTokenHandler.connect(addr1).mint(0)).to.be.revertedWith(
			"VaultHandler::notZero: value can't be 0"
		);
		await expect(ercTokenHandler.connect(addr1).mint(amount))
			.to.emit(ercTokenHandler, "TokensMinted")
			.withArgs(accounts[1], 1, amount);
		tcapBalance = await tcapInstance.balanceOf(accounts[1]);
		expect(tcapBalance).to.eq(amount);
		vault = await ercTokenHandler.getVault(1);
		expect(vault[0]).to.eq(1);
		expect(vault[1]).to.eq(reqAmount2);
		expect(vault[2]).to.eq(accounts[1]);
		expect(vault[3]).to.eq(amount);
		await expect(ercTokenHandler.connect(addr1).mint(lowAmount)).to.be.revertedWith(
			"VaultHandler::mint: collateral below min required ratio"
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
		).to.be.revertedWith("TCAP::transfer: can't transfer to TCAP contract");
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
			"VaultHandler::removeCollateral: collateral below min required ratio"
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

	// it("...should allow owner to retrieve fees in the contract", async () => {
	// 	let ethBalance = await ethers.provider.getBalance(ercTokenHandler.address);
	// 	let accountBalance = await ethers.provider.getBalance(accounts[0]);
	// 	let orchestratorBalance = await ethers.provider.getBalance(orchestratorInstance.address);
	// 	await expect(ercTokenHandler.connect(addr3).retrieveFees()).to.be.revertedWith(
	// 		"Ownable: caller is not the owner"
	// 	);
	// 	await expect(orchestratorInstance.connect(owner).retrieveVaultFees(ercTokenHandler.address))
	// 		.to.emit(ercTokenHandler, "FeesRetrieved")
	// 		.withArgs(orchestratorInstance.address, ethBalance);
	// 	let currentAccountBalance = await ethers.provider.getBalance(orchestratorInstance.address);
	// 	expect(currentAccountBalance).to.eq(orchestratorBalance.add(ethBalance));
	// 	await orchestratorInstance.connect(owner).retrieveFees();
	// 	currentAccountBalance = await ethers.provider.getBalance(accounts[0]);
	// 	expect(currentAccountBalance).to.gt(accountBalance);
	// 	ethBalance = await ethers.provider.getBalance(ercTokenHandler.address);
	// 	expect(ethBalance).to.eq(0);
	// 	ethBalance = await ethers.provider.getBalance(orchestratorInstance.address);
	// 	expect(ethBalance).to.eq(0);
	// });

	it("...should allow users to burn tokens", async () => {
		const treasuryAddress = await treasury.getAddress();
		const beforeTreasury = await ethers.provider.getBalance(treasuryAddress);

		const amount = ethersProvider.utils.parseEther("10");
		const amount2 = ethersProvider.utils.parseEther("11");
		const bigAmount = ethersProvider.utils.parseEther("100");
		const ethHighAmount = ethersProvider.utils.parseEther("50");
		const reqAmount2 = await ercTokenHandler.requiredCollateral(amount2);
		const ethAmount = await ercTokenHandler.getFee(amount);
		const ethAmount2 = await ercTokenHandler.getFee(bigAmount);

		await expect(ercTokenHandler.connect(addr3).burn(amount)).to.be.revertedWith(
			"VaultHandler::vaultExists: no vault created"
		);
		await expect(ercTokenHandler.connect(addr1).burn(amount)).to.be.revertedWith(
			"VaultHandler::burn: burn fee different than required"
		);
		await expect(
			ercTokenHandler.connect(addr1).burn(bigAmount, { value: ethAmount2 })
		).to.be.revertedWith("VaultHandler::burn: amount greater than debt");
		await expect(
			ercTokenHandler.connect(addr1).burn(amount, { value: ethHighAmount })
		).to.be.revertedWith("VaultHandler::burn: burn fee different than required");
		await expect(ercTokenHandler.connect(addr1).burn(0)).to.be.revertedWith(
			"VaultHandler::notZero: value can't be 0"
		);
		await expect(ercTokenHandler.connect(addr1).burn(amount, { value: ethAmount }))
			.to.emit(ercTokenHandler, "TokensBurned")
			.withArgs(accounts[1], 1, amount);
		let tcapBalance = await tcapInstance.balanceOf(accounts[1]);
		expect(tcapBalance).to.eq(0);
		vault = await ercTokenHandler.getVault(1);
		expect(vault[0]).to.eq(1);
		expect(vault[1]).to.eq(reqAmount2);
		expect(vault[2]).to.eq(accounts[1]);
		expect(vault[3]).to.eq(0);

		const afterTreasury = await ethers.provider.getBalance(treasuryAddress);
		expect(afterTreasury.gt(beforeTreasury)).eq(true);
	});

	it("...should update the collateral ratio", async () => {
		let ratio = await ercTokenHandler.getVaultRatio(1);
		expect(ratio).to.eq(0);
	});

	it("...should allow users to retrieve stake when debt is paid", async () => {
		let vault = await ercTokenHandler.getVault(1);
		await expect(ercTokenHandler.connect(addr1).removeCollateral(vault[1]))
			.to.emit(ercTokenHandler, "CollateralRemoved")
			.withArgs(accounts[1], 1, vault[1]);
		vault = await ercTokenHandler.getVault(1);
		expect(vault[0]).to.eq(1);
		expect(vault[1]).to.eq(0);
		expect(vault[2]).to.eq(accounts[1]);
		expect(vault[3]).to.eq(0);
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
			"VaultHandler::liquidateVault: no vault created"
		);
		await expect(ercTokenHandler.connect(addr3).liquidateVault(2, 0)).to.be.revertedWith(
			"VaultHandler::liquidateVault: vault is not liquidable"
		);
		const totalMarketCap = "43129732288636297500";
		await aggregatorTCAPInstance.connect(owner).setLatestAnswer(totalMarketCap);
	});

	it("...should get the required collateral for liquidation", async () => {
		let reqLiquidation = await ercTokenHandler.requiredLiquidationTCAP(2);
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
		let reqLiquidation = await ercTokenHandler.requiredLiquidationTCAP(2);
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
		const reqLiquidation = await ercTokenHandler.requiredLiquidationTCAP(2);
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
		const treasuryAddress = await treasury.getAddress();
		const beforeTreasury = await ethers.provider.getBalance(treasuryAddress);
		let vaultRatio = await ercTokenHandler.getVaultRatio(2);

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
		let reqLiquidation = await ercTokenHandler.requiredLiquidationTCAP(2);
		let aboveReqLiquidation = reqLiquidation.add(liquidatorAmount);

		let tcapBalance = await tcapInstance.balanceOf(accounts[3]);
		let collateralBalance = await ercTokenInstance.balanceOf(accounts[3]);
		let vault = await ercTokenHandler.getVault(2);
		const burnAmount = await ercTokenHandler.getFee(reqLiquidation);
		const aboveBurnAmount = await ercTokenHandler.getFee(aboveReqLiquidation);
		const fakeBurn = await ercTokenHandler.getFee(1);
		let oldBalance = await ethers.provider.getBalance(accounts[3]);
		await expect(
			ercTokenHandler.connect(addr3).liquidateVault(2, reqLiquidation)
		).to.be.revertedWith("VaultHandler::liquidateVault: burn fee less than required");
		await expect(
			ercTokenHandler.connect(addr3).liquidateVault(2, 1, { value: fakeBurn })
		).to.be.revertedWith(
			"VaultHandler::liquidateVault: liquidation amount different than required"
		);
		await expect(
			ercTokenHandler
				.connect(addr3)
				.liquidateVault(2, aboveReqLiquidation, { value: aboveBurnAmount })
		)
			.to.emit(ercTokenHandler, "VaultLiquidated")
			.withArgs(2, accounts[3], reqLiquidation, liquidationReward);

		vaultRatio = await ercTokenHandler.getVaultRatio(2);
		let newTcapBalance = await tcapInstance.balanceOf(accounts[3]);
		let newCollateralBalance = await ercTokenInstance.balanceOf(accounts[3]);
		let updatedVault = await ercTokenHandler.getVault(2);
		let currentEthBalance = await ethers.provider.getBalance(ercTokenHandler.address);
		expect(currentEthBalance).to.eq(0);
		expect(updatedVault[1]).to.eq(vault[1].sub(liquidationReward));
		expect(updatedVault[3]).to.eq(vault[3].sub(reqLiquidation));
		expect(newCollateralBalance).to.eq(collateralBalance.add(liquidationReward));
		expect(tcapBalance).to.eq(newTcapBalance.add(reqLiquidation)); //increase earnings
		expect(vaultRatio).to.be.gte(parseInt(ratio)); // set vault back to ratio
		const afterTreasury = await ethers.provider.getBalance(treasuryAddress);
		expect(afterTreasury.eq(beforeTreasury.add(burnAmount)));

		let newBalance = await ethers.provider.getBalance(accounts[3]);
		expect(newBalance).to.lte(oldBalance);
	});

	it("...should allow owner to pause contract", async () => {
		await expect(ercTokenHandler.connect(addr1).pause()).to.be.revertedWith(
			"Ownable: caller is not the owner"
		);
		await expect(orchestratorInstance.connect(guardian).pauseVault(ercTokenHandler.address))
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
		await expect(orchestratorInstance.connect(guardian).unpauseVault(ercTokenHandler.address))
			.to.emit(ercTokenHandler, "Unpaused")
			.withArgs(orchestratorInstance.address);
		let paused = await ercTokenHandler.paused();
		expect(paused).to.eq(false);
	});
});
