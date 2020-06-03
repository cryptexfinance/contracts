var expect = require("chai").expect;
var ethersProvider = require("ethers");

describe("TCAP.x Token", async function () {
	let tcapInstance;
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
		const TCAPX = await ethers.getContractFactory("TCAPX");
		tcapInstance = await TCAPX.deploy("TCAP.X", "TCAPX", 18);
		await tcapInstance.deployed();
		expect(tcapInstance.address).properAddress;
	});

	it("...should set the correct initial values", async () => {
		const symbol = await tcapInstance.symbol();
		const name = await tcapInstance.name();
		const decimals = await tcapInstance.decimals();
		const defaultOwner = await tcapInstance.owner();
		expect(defaultOwner).to.eq(accounts[0]);
		expect(symbol).to.eq("TCAPX", "Symbol should equal TCAPX");
		expect(name).to.eq("TCAP.X");
		expect(decimals).to.eq(18, "Decimals should be 18");
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
			"Caller is not the handler"
		);
	});

	it("...shouldn't allow users to burn", async () => {
		const amount = ethersProvider.utils.parseEther("1000000");
		await expect(tcapInstance.burn(accounts[1], amount)).to.be.revertedWith(
			"Caller is not the handler"
		);
	});

	it("...should allow owner to add Handlers", async () => {
		await expect(tcapInstance.connect(addr1).addTokenHandler(accounts[1])).to.be.revertedWith(
			"Ownable: caller is not the owner"
		);
		await expect(tcapInstance.connect(owner).addTokenHandler(accounts[2]))
			.to.emit(tcapInstance, "LogAddTokenHandler")
			.withArgs(accounts[0], accounts[2]);
		let currentHandler = await tcapInstance.tokenHandlers(accounts[2]);
		expect(currentHandler).to.eq(true);
		await expect(tcapInstance.connect(owner).addTokenHandler(accounts[3]))
			.to.emit(tcapInstance, "LogAddTokenHandler")
			.withArgs(accounts[0], accounts[3]);
		currentHandler = await tcapInstance.tokenHandlers(accounts[3]);
		expect(currentHandler).to.eq(true);
	});

	it("...should allow Handler to mint tokens", async () => {
		const amount = ethersProvider.utils.parseEther("100");
		await expect(tcapInstance.connect(handler).mint(accounts[1], amount))
			.to.emit(tcapInstance, "Transfer")
			.withArgs(ethersProvider.constants.AddressZero, accounts[1], amount);
		let balance = await tcapInstance.balanceOf(accounts[1]);
		expect(balance).to.eq(amount);
		let totalSupply = await tcapInstance.totalSupply();
		expect(totalSupply).to.eq(amount);
		await expect(tcapInstance.connect(handler2).mint(accounts[4], amount))
			.to.emit(tcapInstance, "Transfer")
			.withArgs(ethersProvider.constants.AddressZero, accounts[4], amount);
		balance = await tcapInstance.balanceOf(accounts[4]);
		expect(balance).to.eq(amount);
		totalSupply = await tcapInstance.totalSupply();
		expect(totalSupply).to.eq(amount.add(amount));
	});

	it("...should allow users to transfer", async () => {
		const amount = ethersProvider.utils.parseEther("100");
		const bigAmount = ethersProvider.utils.parseEther("10000");
		await expect(tcapInstance.connect(owner).transfer(accounts[1], amount)).to.be.revertedWith(
			"ERC20: transfer amount exceeds balance"
		);
		await expect(tcapInstance.connect(addr1).transfer(accounts[0], bigAmount)).to.be.revertedWith(
			"ERC20: transfer amount exceeds balance"
		);
		await expect(tcapInstance.connect(addr1).transfer(accounts[0], amount))
			.to.emit(tcapInstance, "Transfer")
			.withArgs(accounts[1], accounts[0], amount);
		let balance = await tcapInstance.balanceOf(accounts[1]);
		expect(balance).to.eq(0);
		balance = await tcapInstance.balanceOf(accounts[0]);
		expect(balance).to.eq(amount);
	});

	it("...should allow Handler to burn tokens", async () => {
		const amount = ethersProvider.utils.parseEther("100");
		const bigAmount = ethersProvider.utils.parseEther("10000");
		await expect(tcapInstance.connect(handler).burn(accounts[0], bigAmount)).to.be.revertedWith(
			"ERC20: burn amount exceeds balance"
		);
		await expect(tcapInstance.connect(handler).burn(accounts[1], amount)).to.be.revertedWith(
			"ERC20: burn amount exceeds balance"
		);
		await expect(tcapInstance.connect(handler).burn(accounts[0], amount))
			.to.emit(tcapInstance, "Transfer")
			.withArgs(accounts[0], ethersProvider.constants.AddressZero, amount);
		let balance = await tcapInstance.balanceOf(accounts[0]);
		expect(balance).to.eq(0);
		await expect(tcapInstance.connect(handler2).burn(accounts[4], amount))
			.to.emit(tcapInstance, "Transfer")
			.withArgs(accounts[4], ethersProvider.constants.AddressZero, amount);
		balance = await tcapInstance.balanceOf(accounts[4]);
		expect(balance).to.eq(0);
		const totalSupply = await tcapInstance.totalSupply();
		expect(totalSupply).to.eq(0);
	});
});
