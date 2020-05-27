var expect = require("chai").expect;
var ethersProvider = require("ethers");

describe("TCAP.x Token Handler", async function () {
	let tokenHandlerInstance, tcapInstance, stablecoinInstance, oracleInstance;
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
		const TCAPXHandler = await ethers.getContractFactory("TokenHandler");
		tokenHandlerInstance = await TCAPXHandler.deploy();
		await tokenHandlerInstance.deployed();
		expect(tokenHandlerInstance.address).properAddress;
		const oracle = await ethers.getContractFactory("Oracle");
		const totalMarketCap = ethersProvider.utils.parseEther("251300189107");
		oracleInstance = await oracle.deploy(totalMarketCap);
		await oracleInstance.deployed();
		const stablecoin = await ethers.getContractFactory("Stablecoin");
		stablecoinInstance = await stablecoin.deploy();
		await stablecoinInstance.deployed();
		await tcapInstance.setTokenHandler(tokenHandlerInstance.address);
	});

	it("...should set the token contract", async () => {
		await expect(tokenHandlerInstance.connect(addr1).setTCAPX(accounts[1])).to.be.revertedWith(
			"Ownable: caller is not the owner"
		);
		await expect(tokenHandlerInstance.connect(owner).setTCAPX(tcapInstance.address))
			.to.emit(tokenHandlerInstance, "LogSetTCAPX")
			.withArgs(accounts[0], tcapInstance.address);
		let currentTCAPX = await tokenHandlerInstance.TCAPXToken();
		expect(currentTCAPX).to.eq(tcapInstance.address);
	});

	it("...should set the oracle contract", async () => {
		await expect(tokenHandlerInstance.connect(addr1).setOracle(accounts[1])).to.be.revertedWith(
			"Ownable: caller is not the owner"
		);
		await expect(tokenHandlerInstance.connect(owner).setOracle(oracleInstance.address))
			.to.emit(tokenHandlerInstance, "LogSetOracle")
			.withArgs(accounts[0], oracleInstance.address);
		let currentOracle = await tokenHandlerInstance.oracle();
		expect(currentOracle).to.eq(oracleInstance.address);
	});

	it("...should set the stablecoin contract", async () => {
		await expect(tokenHandlerInstance.connect(addr1).setStablecoin(accounts[1])).to.be.revertedWith(
			"Ownable: caller is not the owner"
		);
		await expect(tokenHandlerInstance.connect(owner).setStablecoin(stablecoinInstance.address))
			.to.emit(tokenHandlerInstance, "LogSetStablecoin")
			.withArgs(accounts[0], stablecoinInstance.address);
		let currentStablecoin = await tokenHandlerInstance.stablecoin();
		expect(currentStablecoin).to.eq(stablecoinInstance.address);
	});

	it("...should set the divisor value", async () => {
		await expect(tokenHandlerInstance.connect(addr1).setDivisor(1)).to.be.revertedWith(
			"Ownable: caller is not the owner"
		);
		await expect(tokenHandlerInstance.connect(owner).setDivisor(divisor))
			.to.emit(tokenHandlerInstance, "LogSetDivisor")
			.withArgs(accounts[0], divisor);
		let currentDivisor = await tokenHandlerInstance.divisor();
		expect(currentDivisor).to.eq(divisor);
	});

	it("...should set the collateral ratio", async () => {
		await expect(tokenHandlerInstance.connect(addr1).setRatio(1)).to.be.revertedWith(
			"Ownable: caller is not the owner"
		);
		await expect(tokenHandlerInstance.connect(owner).setRatio(ratio))
			.to.emit(tokenHandlerInstance, "LogSetRatio")
			.withArgs(accounts[0], ratio);
		let currentRatio = await tokenHandlerInstance.ratio();
		expect(currentRatio).to.eq(ratio);
	});

	it("...should return the token price", async () => {
		let tcapxPrice = await tokenHandlerInstance.TCAPXPrice();
		let totalMarketCap = await oracleInstance.price();
		let result = totalMarketCap.div(divisor);
		expect(tcapxPrice).to.eq(result);
	});

	it("...should allow owner to add investor to whitelist", async () => {
		await expect(tokenHandlerInstance.connect(addr1).addInvestor(accounts[1])).to.be.revertedWith(
			"Ownable: caller is not the owner"
		);
		await expect(tokenHandlerInstance.connect(owner).addInvestor(accounts[1]))
			.to.emit(tokenHandlerInstance, "RoleGranted")
			.withArgs(
				ethersProvider.utils.keccak256(ethersProvider.utils.toUtf8Bytes("INVESTOR_ROLE")),
				accounts[1],
				accounts[0]
			);
		await expect(tokenHandlerInstance.connect(owner).addInvestor(accounts[2]))
			.to.emit(tokenHandlerInstance, "RoleGranted")
			.withArgs(
				ethersProvider.utils.keccak256(ethersProvider.utils.toUtf8Bytes("INVESTOR_ROLE")),
				accounts[2],
				accounts[0]
			);
		await expect(tokenHandlerInstance.connect(owner).addInvestor(accounts[3]))
			.to.emit(tokenHandlerInstance, "RoleGranted")
			.withArgs(
				ethersProvider.utils.keccak256(ethersProvider.utils.toUtf8Bytes("INVESTOR_ROLE")),
				accounts[3],
				accounts[0]
			);
	});

	it("...should allow owner to remove investor from whitelist", async () => {
		await expect(
			tokenHandlerInstance.connect(addr1).removeInvestor(accounts[0])
		).to.be.revertedWith("Ownable: caller is not the owner");
		await expect(tokenHandlerInstance.connect(owner).removeInvestor(accounts[2]))
			.to.emit(tokenHandlerInstance, "RoleRevoked")
			.withArgs(
				ethersProvider.utils.keccak256(ethersProvider.utils.toUtf8Bytes("INVESTOR_ROLE")),
				accounts[2],
				accounts[0]
			);
	});

	it("...should allow investor to create a vault", async () => {
		let vaultId = await tokenHandlerInstance.vaultToUser(accounts[1]);
		expect(vaultId).eq(0);
		await expect(tokenHandlerInstance.connect(addr1).createVault())
			.to.emit(tokenHandlerInstance, "LogCreateVault")
			.withArgs(accounts[1], 1);
		vaultId = await tokenHandlerInstance.vaultToUser(accounts[1]);
		expect(vaultId).eq(1);
		await expect(tokenHandlerInstance.connect(addr2).createVault()).to.be.revertedWith(
			"Caller is not investor"
		);
		vaultId = await tokenHandlerInstance.vaultToUser(accounts[2]);
		expect(vaultId).eq(0);
		await expect(tokenHandlerInstance.connect(addr1).createVault()).to.be.revertedWith(
			"Vault already created"
		);
	});

	it("...should get vault by id", async () => {
		let vault = await tokenHandlerInstance.getVault(1);
		expect(vault[0]).to.eq(1);
		expect(vault[1]).to.eq(0);
		expect(vault[2]).to.eq(accounts[1]);
		expect(vault[3]).to.eq(0);
		vault = await tokenHandlerInstance.getVault(100);
		expect(vault[0]).to.eq(0);
		expect(vault[1]).to.eq(0);
		expect(vault[2]).to.eq(ethersProvider.constants.AddressZero);
		expect(vault[3]).to.eq(0);
	});

	it("...should allow investor to add collateral", async () => {
		const amount = ethersProvider.utils.parseEther("375");
		await expect(tokenHandlerInstance.connect(addr2).addCollateral(amount)).to.be.revertedWith(
			"Caller is not investor"
		);
		let balance = await stablecoinInstance.balanceOf(accounts[1]);
		expect(balance).to.eq(0);
		await expect(tokenHandlerInstance.connect(addr1).addCollateral(amount)).to.be.revertedWith(
			"ERC20: transfer amount exceeds balance"
		);
		await stablecoinInstance.mint(accounts[1], amount);
		await expect(tokenHandlerInstance.connect(addr1).addCollateral(amount)).to.be.revertedWith(
			"ERC20: transfer amount exceeds allowance"
		);
		await stablecoinInstance.connect(addr1).approve(tokenHandlerInstance.address, amount);
		balance = await stablecoinInstance.balanceOf(accounts[1]);
		expect(balance).to.eq(amount);
		await expect(tokenHandlerInstance.connect(addr1).addCollateral(amount))
			.to.emit(tokenHandlerInstance, "LogAddCollateral")
			.withArgs(accounts[1], 1, amount);
		let vault = await tokenHandlerInstance.getVault(1);
		expect(vault[0]).to.eq(1);
		expect(vault[1]).to.eq(amount);
		expect(vault[2]).to.eq(accounts[1]);
		expect(vault[3]).to.eq(0);
		balance = await stablecoinInstance.balanceOf(accounts[1]);
		expect(balance).to.eq(0);
		balance = await stablecoinInstance.balanceOf(tokenHandlerInstance.address);
		expect(balance).to.eq(amount);
		await stablecoinInstance.mint(accounts[1], amount);
		await stablecoinInstance.connect(addr1).approve(tokenHandlerInstance.address, amount);
		await tokenHandlerInstance.connect(addr1).addCollateral(amount);
		vault = await tokenHandlerInstance.getVault(1);
		expect(vault[0]).to.eq(1);
		expect(vault[1]).to.eq(amount.add(amount));
		expect(vault[2]).to.eq(accounts[1]);
		expect(vault[3]).to.eq(0);
		balance = await stablecoinInstance.balanceOf(tokenHandlerInstance.address);
		expect(balance).to.eq(amount.add(amount));
	});

	it("...should allow investor to retrieve unused collateral", async () => {
		const amount = ethersProvider.utils.parseEther("375");
		const bigAmount = ethersProvider.utils.parseEther("100375");
		let balance = await stablecoinInstance.balanceOf(accounts[1]);
		expect(balance).to.eq(0);
		await expect(tokenHandlerInstance.connect(addr2).removeCollateral(amount)).to.be.revertedWith(
			"Retrieve amount higher than collateral"
		);
		await expect(
			tokenHandlerInstance.connect(addr1).removeCollateral(bigAmount)
		).to.be.revertedWith("Retrieve amount higher than collateral");
		await expect(tokenHandlerInstance.connect(addr1).removeCollateral(amount))
			.to.emit(tokenHandlerInstance, "LogRemoveCollateral")
			.withArgs(accounts[1], 1, amount);
		let vault = await tokenHandlerInstance.getVault(1);
		expect(vault[0]).to.eq(1);
		expect(vault[1]).to.eq(amount);
		expect(vault[2]).to.eq(accounts[1]);
		expect(vault[3]).to.eq(0);
		balance = await stablecoinInstance.balanceOf(accounts[1]);
		expect(balance).to.eq(amount);
		balance = await stablecoinInstance.balanceOf(tokenHandlerInstance.address);
		expect(balance).to.eq(amount);
		await tokenHandlerInstance.connect(addr1).removeCollateral(amount);
		vault = await tokenHandlerInstance.getVault(1);
		expect(vault[0]).to.eq(1);
		expect(vault[1]).to.eq(0);
		expect(vault[2]).to.eq(accounts[1]);
		expect(vault[3]).to.eq(0);
		balance = await stablecoinInstance.balanceOf(accounts[1]);
		expect(balance).to.eq(amount.add(amount));
		balance = await stablecoinInstance.balanceOf(tokenHandlerInstance.address);
		expect(balance).to.eq(0);
	});

	it("...should allow investors to mint tokens", async () => {
		const amount = ethersProvider.utils.parseEther("10");
		const bigAmount = ethersProvider.utils.parseEther("100");
		const reqAmount = await tokenHandlerInstance.requiredCollateral(amount);
		await stablecoinInstance.mint(accounts[1], reqAmount);
		let tcapxBalance = await tcapInstance.balanceOf(accounts[1]);
		await stablecoinInstance.connect(addr1).approve(tokenHandlerInstance.address, reqAmount);
		await tokenHandlerInstance.connect(addr1).addCollateral(reqAmount);
		await expect(tokenHandlerInstance.connect(addr3).mint(amount)).to.be.revertedWith(
			"Not enough collateral"
		);
		await expect(tokenHandlerInstance.connect(addr1).mint(bigAmount)).to.be.revertedWith(
			"Not enough collateral"
		);
		await expect(tokenHandlerInstance.connect(addr1).mint(amount))
			.to.emit(tokenHandlerInstance, "LogMint")
			.withArgs(accounts[1], 1, amount);
		tcapxBalance = await tcapInstance.balanceOf(accounts[1]);
		expect(tcapxBalance).to.eq(amount);
		vault = await tokenHandlerInstance.getVault(1);
		expect(vault[0]).to.eq(1);
		expect(vault[1]).to.eq(0);
		expect(vault[2]).to.eq(accounts[1]);
		expect(vault[3]).to.eq(reqAmount);
	});

	xit("...should allow investors to burn tokens", async () => {});
	xit("...should return the required collateral amount", async () => {});
	xit("...should allow users to liquidate investors", async () => {});
	xit("LIQUIDATION CONFIGURATION TESTS", async () => {});
});
