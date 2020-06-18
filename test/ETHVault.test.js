var expect = require("chai").expect;
var ethersProvider = require("ethers");

describe("TCAP.x ETH Vault", async function () {
	let vaultInstance, tcapInstance, tcapOracleInstance, priceOracleInstance;
	let [owner, addr1, addr2, addr3] = [];
	let accounts = [];
	let divisor = "10000000000";
	let ratio = "150";

	before("Set Accounts", async () => {
		let [acc0, acc1, acc3, acc4] = await ethers.getSigners();
		owner = acc0;
		addr1 = acc1;
		addr2 = acc3;
		addr3 = acc4;

		if (owner && addr1) {
			accounts.push(await owner.getAddress());
			accounts.push(await addr1.getAddress());
			accounts.push(await addr2.getAddress());
			accounts.push(await addr3.getAddress());
		}
	});

	it("...should deploy the contract", async () => {
		const TCAPX = await ethers.getContractFactory("TCAPX");
		tcapInstance = await TCAPX.deploy("TCAP.X", "TCAPX", 18);
		await tcapInstance.deployed();
		const ethVault = await ethers.getContractFactory("ETHVault");
		vaultInstance = await ethVault.deploy();
		await vaultInstance.deployed();
		expect(vaultInstance.address).properAddress;
		const oracle = await ethers.getContractFactory("Oracle");
		const totalMarketCap = ethersProvider.utils.parseEther("251300189107");
		const ethPrice = ethersProvider.utils.parseEther("230");
		tcapOracleInstance = await oracle.deploy(totalMarketCap);
		await tcapOracleInstance.deployed();
		priceOracleInstance = await oracle.deploy(ethPrice);
		await priceOracleInstance.deployed();
		await tcapInstance.addTokenHandler(vaultInstance.address);
	});

	it("...should set the tcap.x contract", async () => {
		await expect(vaultInstance.connect(addr1).setTCAPXContract(accounts[1])).to.be.revertedWith(
			"Ownable: caller is not the owner"
		);
		await expect(vaultInstance.connect(owner).setTCAPXContract(tcapInstance.address))
			.to.emit(vaultInstance, "LogSetTCAPXContract")
			.withArgs(accounts[0], tcapInstance.address);
		let currentTCAPX = await vaultInstance.TCAPXToken();
		expect(currentTCAPX).to.eq(tcapInstance.address);
	});

	it("...should set the oracle contract", async () => {
		await expect(vaultInstance.connect(addr1).setTcapOracle(accounts[1])).to.be.revertedWith(
			"Ownable: caller is not the owner"
		);
		await expect(vaultInstance.connect(owner).setTcapOracle(tcapOracleInstance.address))
			.to.emit(vaultInstance, "LogSetTcapOracle")
			.withArgs(accounts[0], tcapOracleInstance.address);
		let currentOracle = await vaultInstance.tcapOracle();
		expect(currentOracle).to.eq(tcapOracleInstance.address);
	});

	it("...should set the eth/usd oracle", async () => {
		await expect(vaultInstance.connect(addr1).setPriceOracle(accounts[1])).to.be.revertedWith(
			"Ownable: caller is not the owner"
		);
		await expect(vaultInstance.connect(owner).setPriceOracle(tcapOracleInstance.address))
			.to.emit(vaultInstance, "LogSetPriceOracle")
			.withArgs(accounts[0], tcapOracleInstance.address);
		let currentPriceOracle = await vaultInstance.priceOracle();
		expect(currentPriceOracle).to.eq(tcapOracleInstance.address);
	});
	it("...should set the divisor value", async () => {
		await expect(vaultInstance.connect(addr1).setDivisor(1)).to.be.revertedWith(
			"Ownable: caller is not the owner"
		);
		await expect(vaultInstance.connect(owner).setDivisor(divisor))
			.to.emit(vaultInstance, "LogSetDivisor")
			.withArgs(accounts[0], divisor);
		let currentDivisor = await vaultInstance.divisor();
		expect(currentDivisor).to.eq(divisor);
	});

	it("...should set the collateral ratio", async () => {
		await expect(vaultInstance.connect(addr1).setRatio(1)).to.be.revertedWith(
			"Ownable: caller is not the owner"
		);
		await expect(vaultInstance.connect(owner).setRatio(ratio))
			.to.emit(vaultInstance, "LogSetRatio")
			.withArgs(accounts[0], ratio);
		let currentRatio = await vaultInstance.ratio();
		expect(currentRatio).to.eq(ratio);
	});

	it("...should return the token price", async () => {
		let tcapxPrice = await vaultInstance.TCAPXPrice();
		let totalMarketCap = await tcapOracleInstance.price();
		let result = totalMarketCap.div(divisor);
		expect(tcapxPrice).to.eq(result);
	});

	it("...should allow owner to add investor to whitelist", async () => {
		await expect(vaultInstance.connect(addr1).addInvestor(accounts[1])).to.be.revertedWith(
			"Ownable: caller is not the owner"
		);
		await expect(vaultInstance.connect(owner).addInvestor(accounts[1]))
			.to.emit(vaultInstance, "RoleGranted")
			.withArgs(
				ethersProvider.utils.keccak256(ethersProvider.utils.toUtf8Bytes("INVESTOR_ROLE")),
				accounts[1],
				accounts[0]
			);
		await expect(vaultInstance.connect(owner).addInvestor(accounts[2]))
			.to.emit(vaultInstance, "RoleGranted")
			.withArgs(
				ethersProvider.utils.keccak256(ethersProvider.utils.toUtf8Bytes("INVESTOR_ROLE")),
				accounts[2],
				accounts[0]
			);
		await expect(vaultInstance.connect(owner).addInvestor(accounts[3]))
			.to.emit(vaultInstance, "RoleGranted")
			.withArgs(
				ethersProvider.utils.keccak256(ethersProvider.utils.toUtf8Bytes("INVESTOR_ROLE")),
				accounts[3],
				accounts[0]
			);
	});

	it("...should allow owner to remove investor from whitelist", async () => {
		await expect(vaultInstance.connect(addr1).removeInvestor(accounts[0])).to.be.revertedWith(
			"Ownable: caller is not the owner"
		);
		await expect(vaultInstance.connect(owner).removeInvestor(accounts[2]))
			.to.emit(vaultInstance, "RoleRevoked")
			.withArgs(
				ethersProvider.utils.keccak256(ethersProvider.utils.toUtf8Bytes("INVESTOR_ROLE")),
				accounts[2],
				accounts[0]
			);
	});

	it("...should allow investor to create a vault", async () => {
		let vaultId = await vaultInstance.vaultToUser(accounts[1]);
		expect(vaultId).eq(0);
		await expect(vaultInstance.connect(addr1).createVault())
			.to.emit(vaultInstance, "LogCreateVault")
			.withArgs(accounts[1], 1);
		vaultId = await vaultInstance.vaultToUser(accounts[1]);
		expect(vaultId).eq(1);
		await expect(vaultInstance.connect(addr2).createVault()).to.be.revertedWith(
			"Caller is not investor"
		);
		vaultId = await vaultInstance.vaultToUser(accounts[2]);
		expect(vaultId).eq(0);
		await expect(vaultInstance.connect(addr1).createVault()).to.be.revertedWith(
			"Vault already created"
		);
	});

	it("...should get vault by id", async () => {
		let vault = await vaultInstance.getVault(1);
		expect(vault[0]).to.eq(1);
		expect(vault[1]).to.eq(0);
		expect(vault[2]).to.eq(accounts[1]);
		expect(vault[3]).to.eq(0);
		vault = await vaultInstance.getVault(100);
		expect(vault[0]).to.eq(0);
		expect(vault[1]).to.eq(0);
		expect(vault[2]).to.eq(ethersProvider.constants.AddressZero);
		expect(vault[3]).to.eq(0);
	});

	xit("...should allow investor to stake collateral", async () => {
		const amount = ethersProvider.utils.parseEther("375");
		await expect(vaultInstance.connect(addr2).addCollateral(amount)).to.be.revertedWith(
			"Caller is not investor"
		);
		await expect(vaultInstance.connect(addr3).addCollateral(amount)).to.be.revertedWith(
			"No Vault created"
		);
		let balance = await stablecoinInstance.balanceOf(accounts[1]);
		expect(balance).to.eq(0);

		await expect(vaultInstance.connect(addr1).addCollateral(amount)).to.be.revertedWith(
			"ERC20: transfer amount exceeds balance"
		);
		await stablecoinInstance.mint(accounts[1], amount);
		await expect(vaultInstance.connect(addr1).addCollateral(amount)).to.be.revertedWith(
			"ERC20: transfer amount exceeds allowance"
		);
		await stablecoinInstance.connect(addr1).approve(vaultInstance.address, amount);
		balance = await stablecoinInstance.balanceOf(accounts[1]);
		expect(balance).to.eq(amount);
		await expect(vaultInstance.connect(addr1).addCollateral(amount))
			.to.emit(vaultInstance, "LogAddCollateral")
			.withArgs(accounts[1], 1, amount);
		let vault = await vaultInstance.getVault(1);
		expect(vault[0]).to.eq(1);
		expect(vault[1]).to.eq(amount);
		expect(vault[2]).to.eq(accounts[1]);
		expect(vault[3]).to.eq(0);
		balance = await stablecoinInstance.balanceOf(accounts[1]);
		expect(balance).to.eq(0);
		balance = await stablecoinInstance.balanceOf(vaultInstance.address);
		expect(balance).to.eq(amount);
		await stablecoinInstance.mint(accounts[1], amount);
		await stablecoinInstance.connect(addr1).approve(vaultInstance.address, amount);
		await vaultInstance.connect(addr1).addCollateral(amount);
		vault = await vaultInstance.getVault(1);
		expect(vault[0]).to.eq(1);
		expect(vault[1]).to.eq(amount.add(amount));
		expect(vault[2]).to.eq(accounts[1]);
		expect(vault[3]).to.eq(0);
		balance = await stablecoinInstance.balanceOf(vaultInstance.address);
		expect(balance).to.eq(amount.add(amount));
	});

	xit("...should allow investor to retrieve unused collateral", async () => {
		const amount = ethersProvider.utils.parseEther("375");
		const bigAmount = ethersProvider.utils.parseEther("100375");
		let balance = await stablecoinInstance.balanceOf(accounts[1]);
		expect(balance).to.eq(0);
		ratio = await vaultInstance.getVaultRatio(1);

		await expect(vaultInstance.connect(addr3).removeCollateral(amount)).to.be.revertedWith(
			"No Vault created"
		);
		await expect(vaultInstance.connect(addr1).removeCollateral(bigAmount)).to.be.revertedWith(
			"Retrieve amount higher than collateral"
		);
		await expect(vaultInstance.connect(addr1).removeCollateral(amount))
			.to.emit(vaultInstance, "LogRemoveCollateral")
			.withArgs(accounts[1], 1, amount);

		let vault = await vaultInstance.getVault(1);
		expect(vault[0]).to.eq(1);
		expect(vault[1]).to.eq(amount);
		expect(vault[2]).to.eq(accounts[1]);
		expect(vault[3]).to.eq(0);
		balance = await stablecoinInstance.balanceOf(accounts[1]);
		expect(balance).to.eq(amount);
		balance = await stablecoinInstance.balanceOf(vaultInstance.address);
		expect(balance).to.eq(amount);
		await vaultInstance.connect(addr1).removeCollateral(amount);
		vault = await vaultInstance.getVault(1);
		expect(vault[0]).to.eq(1);
		expect(vault[1]).to.eq(0);
		expect(vault[2]).to.eq(accounts[1]);
		expect(vault[3]).to.eq(0);
		balance = await stablecoinInstance.balanceOf(accounts[1]);
		expect(balance).to.eq(amount.add(amount));
		balance = await stablecoinInstance.balanceOf(vaultInstance.address);
		expect(balance).to.eq(0);
	});

	xit("...should allow investors to mint tokens", async () => {
		const amount = ethersProvider.utils.parseEther("10");
		const lowAmount = ethersProvider.utils.parseEther("1");
		const bigAmount = ethersProvider.utils.parseEther("100");
		const reqAmount = await vaultInstance.minRequiredCollateral(amount);
		await stablecoinInstance.mint(accounts[1], reqAmount);
		let tcapxBalance = await tcapInstance.balanceOf(accounts[1]);
		expect(tcapxBalance).to.eq(0);
		await stablecoinInstance.connect(addr1).approve(vaultInstance.address, reqAmount);
		await vaultInstance.connect(addr1).addCollateral(reqAmount);
		await expect(vaultInstance.connect(addr3).mint(amount)).to.be.revertedWith("No Vault created");
		await expect(vaultInstance.connect(addr1).mint(bigAmount)).to.be.revertedWith(
			"Not enough collateral"
		);
		await expect(vaultInstance.connect(addr1).mint(amount))
			.to.emit(vaultInstance, "LogMint")
			.withArgs(accounts[1], 1, amount);
		tcapxBalance = await tcapInstance.balanceOf(accounts[1]);
		expect(tcapxBalance).to.eq(amount);
		vault = await vaultInstance.getVault(1);
		expect(vault[0]).to.eq(1);
		expect(vault[1]).to.eq(reqAmount);
		expect(vault[2]).to.eq(accounts[1]);
		expect(vault[3]).to.eq(amount);
		await expect(vaultInstance.connect(addr1).mint(lowAmount)).to.be.revertedWith(
			"Collateral below min required ratio"
		);
	});

	xit("...should allow users to get collateral ratio", async () => {
		let ratio = await vaultInstance.getVaultRatio(2);
		expect(ratio).to.eq(0);
		ratio = await vaultInstance.getVaultRatio(1);
		expect(ratio).to.eq(150);
	});

	xit("...shouln't allow investors to retrieve stake unless debt is paid", async () => {
		let vault = await vaultInstance.getVault(1);
		await expect(vaultInstance.connect(addr1).removeCollateral(vault[1])).to.be.revertedWith(
			"Collateral below min required ratio"
		);
	});

	xit("...should allow investors to burn tokens", async () => {
		const amount = ethersProvider.utils.parseEther("10");
		const bigAmount = ethersProvider.utils.parseEther("100");
		const reqAmount = await vaultInstance.minRequiredCollateral(amount);

		await expect(vaultInstance.connect(addr3).burn(amount)).to.be.revertedWith("No Vault created");
		await expect(vaultInstance.connect(addr1).burn(bigAmount)).to.be.revertedWith(
			"Amount greater than debt"
		);
		await expect(vaultInstance.connect(addr1).burn(amount))
			.to.emit(vaultInstance, "LogBurn")
			.withArgs(accounts[1], 1, amount);
		let tcapxBalance = await tcapInstance.balanceOf(accounts[1]);
		expect(tcapxBalance).to.eq(0);
		vault = await vaultInstance.getVault(1);
		expect(vault[0]).to.eq(1);
		expect(vault[1]).to.eq(reqAmount);
		expect(vault[2]).to.eq(accounts[1]);
		expect(vault[3]).to.eq(0);
	});

	xit("...should update change the collateral ratio", async () => {
		ratio = await vaultInstance.getVaultRatio(1);
		expect(ratio).to.eq(0);
	});

	xit("...should allow investors to retrieve stake when debt is paid", async () => {
		let vault = await vaultInstance.getVault(1);
		await expect(vaultInstance.connect(addr1).removeCollateral(vault[1]))
			.to.emit(vaultInstance, "LogRemoveCollateral")
			.withArgs(accounts[1], 1, vault[1]);
		vault = await vaultInstance.getVault(1);
		expect(vault[0]).to.eq(1);
		expect(vault[1]).to.eq(0);
		expect(vault[2]).to.eq(accounts[1]);
		expect(vault[3]).to.eq(0);
	});
	xit("...should allow users to liquidate investors", async () => {});
	xit("LIQUIDATION CONFIGURATION TESTS", async () => {});
});
