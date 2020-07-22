var expect = require("chai").expect;
var ethersProvider = require("ethers");

describe("TCAP Oracle", async function () {
	let tcapOracleInstance;
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
		const oracle = await ethers.getContractFactory("TcapOracle");
		tcapOracleInstance = await oracle.deploy();
		await tcapOracleInstance.deployed();
		expect(tcapOracleInstance.address).properAddress;
	});

	it("...should update the oracle answer", async () => {
		const totalMarketCap = ethersProvider.utils.parseEther("251300189107");
		await expect(tcapOracleInstance.connect(addr1).setLatestAnswer(0)).to.be.revertedWith(
			"Ownable: caller is not the owner"
		);
		await tcapOracleInstance.setLatestAnswer(totalMarketCap);
	});
	it("...should get the oracle answer", async () => {
		const tcap = ethersProvider.utils.parseEther("251300189107");
		let totalMarketCap = await tcapOracleInstance.getLatestAnswer();
		expect(totalMarketCap).to.eq(tcap);
	});
});
