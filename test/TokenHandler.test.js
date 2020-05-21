var expect = require("chai").expect;
var ethersProvider = require("ethers");

describe("TCAP.x Token Handler", async function () {
	let tokenHandlerInstance, tcapInstance;
	let [owner, addr1, addr2] = [];
	let accounts = [];
	let oracleAddress = "0xC257274276a4E539741Ca11b590B9447B26A8051";
	let daiAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";

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
		await expect(tokenHandlerInstance.connect(owner).setOracle(oracleAddress))
			.to.emit(tokenHandlerInstance, "LogSetOracle")
			.withArgs(accounts[0], oracleAddress);
		let currentOracle = await tokenHandlerInstance.oracle();
		expect(currentOracle).to.eq(oracleAddress);
	});

	it("...should set the stablecoin contract", async () => {
		await expect(tokenHandlerInstance.connect(addr1).setStablecoin(accounts[1])).to.be.revertedWith(
			"Ownable: caller is not the owner"
		);
		await expect(tokenHandlerInstance.connect(owner).setStablecoin(daiAddress))
			.to.emit(tokenHandlerInstance, "LogSetStablecoin")
			.withArgs(accounts[0], daiAddress);
		let currentStablecoin = await tokenHandlerInstance.stablecoin();
		expect(currentStablecoin).to.eq(daiAddress);
	});

	xit("...should return the token price", async () => {});
	xit("...should allow investor to create collateral position", async () => {});
	xit("...should allow investor to add collateral", async () => {});
	xit("...should allow investor to retrieve unused collateral", async () => {});
	xit("...should allow users to liquidate investors", async () => {});
	xit("LIQUIDATION CONFIGURATION TESTS", async () => {});
});
