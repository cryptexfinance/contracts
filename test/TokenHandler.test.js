var expect = require("chai").expect;
var ethersProvider = require("ethers");

describe("TCAP.x Token Handler", async function () {
	let tokenHandlerInstance, tcapInstance, stablecoinInstance, oracleInstance;
	let [owner, addr1, addr2] = [];
	let accounts = [];
	let divisor = "10000000000";

	before("Set Accounts", async () => {
		let [acc0, acc1, acc3] = await ethers.getSigners();
		owner = acc0;
		addr1 = acc1;
		addr2 = acc3;
		if (owner && addr1) {
			accounts.push(await owner.getAddress());
			accounts.push(await addr1.getAddress());
			accounts.push(await addr2.getAddress());
		}
	});

	it("...should deploy the contract", async () => {
		const TCAPX = await ethers.getContractFactory("TCAPX");
		tcapInstance = await TCAPX.deploy("TCAP.X", "TCAPX", 11);
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
	});

	it("...should set the token contract", async () => {
		await expect(tokenHandlerInstance.connect(addr1).setTCAPX(accounts[1])).to.be.revertedWith(
			"Ownable: caller is not the owner"
		);
		await expect(tokenHandlerInstance.connect(owner).setTCAPX(tcapInstance.address))
			.to.emit(tokenHandlerInstance, "LogSetTCAPX")
			.withArgs(accounts[0], tcapInstance.address);
		let currentTCAPX = await tokenHandlerInstance.TCAPX();
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
		let vault = await tokenHandlerInstance.vaults(accounts[1]);
		expect(vault).eq(0);
		await expect(tokenHandlerInstance.connect(addr1).createVault())
			.to.emit(tokenHandlerInstance, "LogCreateVault")
			.withArgs(accounts[1], 1);
		vault = await tokenHandlerInstance.vaults(accounts[1]);
		expect(vault).eq(1);
		await expect(tokenHandlerInstance.connect(addr2).createVault()).to.be.revertedWith(
			"Caller is not investor"
		);
		vault = await tokenHandlerInstance.vaults(accounts[2]);
		expect(vault).eq(0);
		await expect(tokenHandlerInstance.connect(addr1).createVault()).to.be.revertedWith(
			"Vault already created"
		);
	});

	xit("...should allow investor to add collateral", async () => {});
	xit("...should allow investor to retrieve unused collateral", async () => {});
	xit("...should allow users to liquidate investors", async () => {});
	xit("LIQUIDATION CONFIGURATION TESTS", async () => {});
});
