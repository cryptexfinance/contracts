var expect = require("chai").expect;
var ethersProvider = require("ethers");

describe("TCAP Token", async function () {
	let tcapInstance;
	let orchestratorInstance;
	let ethVaultInstance;
	let ethVaultInstance2;
	let [owner, addr1, handler, handler2] = [];
	let accounts = [];

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

		let cap = ethers.utils.parseEther("100");
		const TCAP = await ethers.getContractFactory("TCAP");
		tcapInstance = await TCAP.deploy(
			"Total Market Cap Token",
			"TCAP",
			cap,
			orchestratorInstance.address
		);
		await tcapInstance.deployed();
		expect(tcapInstance.address).properAddress;

		//vault
		const wethVault = await ethers.getContractFactory("ERC20VaultHandler");
		ethVaultInstance = await wethVault.deploy(orchestratorInstance.address);
		await ethVaultInstance.deployed();

		ethVaultInstance2 = await wethVault.deploy(orchestratorInstance.address);
		await ethVaultInstance2.deployed();
	});

	it("...should set the correct initial values", async () => {
		const symbol = await tcapInstance.symbol();
		const name = await tcapInstance.name();
		const decimals = await tcapInstance.decimals();
		const defaultOwner = await tcapInstance.owner();
		const cap = await tcapInstance.cap();
		expect(defaultOwner).to.eq(orchestratorInstance.address);
		expect(symbol).to.eq("TCAP", "Symbol should equal TCAP");
		expect(name).to.eq("Total Market Cap Token");
		expect(decimals).to.eq(18, "Decimals should be 18");
		expect(cap).to.eq(ethers.utils.parseEther("100"), "Cap should be 100 Tokens");
	});

	it("...should have the ERC20 standard functions", async () => {
		const totalSupply = await tcapInstance.totalSupply();
		expect(totalSupply).to.eq(0, "Total supply should be 0");
		const balance = await tcapInstance.balanceOf(accounts[0]);
		expect(balance).to.eq(0, "Balance should be 0");
	});

	it("...should allow to approve tokens", async () => {
		const amount = ethersProvider.utils.parseEther("100");
		await tcapInstance.connect(owner).approve(accounts[1], amount);
		const allowance = await tcapInstance.allowance(accounts[0], accounts[1]);
		expect(allowance).to.eq(amount);
	});

	it("...shouldn't allow users to mint", async () => {
		const amount = ethersProvider.utils.parseEther("1000000");
		await expect(tcapInstance.mint(accounts[0], amount)).to.be.revertedWith(
			"Caller is not a handler"
		);
	});

	it("...shouldn't allow users to burn", async () => {
		const amount = ethersProvider.utils.parseEther("1000000");
		await expect(tcapInstance.burn(accounts[1], amount)).to.be.revertedWith(
			"Caller is not a handler"
		);
	});

	it("...should allow owner to add Handlers", async () => {
		await expect(tcapInstance.connect(addr1).addTokenHandler(accounts[1])).to.be.revertedWith(
			"Ownable: caller is not the owner"
		);
		await expect(
			orchestratorInstance
				.connect(owner)
				.addTCAPVault(tcapInstance.address, ethVaultInstance.address)
		)
			.to.emit(tcapInstance, "LogAddTokenHandler")
			.withArgs(orchestratorInstance.address, ethVaultInstance.address);
		let currentHandler = await tcapInstance.tokenHandlers(ethVaultInstance.address);
		expect(currentHandler).to.eq(true);
		await expect(
			orchestratorInstance
				.connect(owner)
				.addTCAPVault(tcapInstance.address, ethVaultInstance2.address)
		)
			.to.emit(tcapInstance, "LogAddTokenHandler")
			.withArgs(orchestratorInstance.address, ethVaultInstance2.address);
		currentHandler = await tcapInstance.tokenHandlers(ethVaultInstance2.address);
		expect(currentHandler).to.eq(true);
	});
});
