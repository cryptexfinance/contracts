var expect = require("chai").expect;
var ethersProvider = require("ethers");

describe("Optimistic Treasury Contract", async function () {
	let OTreasuryInstance, ovmL2Instance, daiTokenInstance;
	let [owner, addr1, handler, handler2] = [];
	let accounts = [];

	before("Set Accounts", async () => {
		let [acc0, acc1, acc3, acc4, acc5, acc6] = await ethers.getSigners();
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
		const ovmL2 = await ethers.getContractFactory("OVML2CrossDomainMessenger");
		ovmL2Instance = await ovmL2.deploy(accounts[0]);
		await ovmL2Instance.deployed();

		const oTreasury = await ethers.getContractFactory("OptimisticTreasury");
		OTreasuryInstance = await oTreasury.deploy(accounts[0], ovmL2Instance.address);
		await OTreasuryInstance.deployed();
		expect(OTreasuryInstance.address).properAddress;

		//test token
		const rewardToken = await ethers.getContractFactory("DAI");
		daiTokenInstance = await rewardToken.deploy();
		daiTokenInstance.mint(OTreasuryInstance.address, ethers.utils.parseEther("1"));
	});

	it("...should set the owner", async () => {
		const defaultOwner = await OTreasuryInstance.owner();
		expect(defaultOwner).to.eq(accounts[0]);
	});

	it("...should be able to send funds to owner of orchestrator", async () => {
		await expect(OTreasuryInstance.connect(addr1).retrieveETH(accounts[0])).to.be.revertedWith(
			"Ownable: caller is not the owner"
		);

		const abi = new ethers.utils.AbiCoder();
		const target = OTreasuryInstance.address;
		const value = 0;
		const signature = "retrieveETH(address)";
		const data = abi.encode(["address"], [accounts[0]]);
		await ovmL2Instance.executeTransaction(target, value, signature, data);
	});

	it("...should allow to execute a custom transaction", async () => {
		const amount = ethers.utils.parseEther("1");
		const newOwner = await addr1.getAddress();
		let currentBalance = await daiTokenInstance.balanceOf(newOwner);
		expect(currentBalance).to.eq(0);
		const abi = new ethers.utils.AbiCoder();

		const transferTarget = daiTokenInstance.address;
		const transferSignature = "mint(address, uint256)";

		console.log("dai contract", transferTarget);
		console.log("treasury contract", OTreasuryInstance.address);
		//
		// const transferData =
		// 	"0x7b63f53700000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c80000000000000000000000000000000000000000000000000de0b6b3a7640000";
		const transferData = abi.encode(["address", "uint256"], [newOwner, amount]);

		const target = OTreasuryInstance.address;
		const value = 0;
		const signature = "executeTransaction(address,uint256,string,bytes)";
		const data = abi.encode(
			["address", "uint256", "string", "bytes"],
			[transferTarget, value, transferSignature, transferData]
		);

		await ovmL2Instance.executeTransaction(target, value, signature, data);

		// await expect(
		// 	OTreasuryInstance.connect(addr1).executeTransaction(target, value, signature, data)
		// ).to.be.revertedWith("Ownable: caller is not the owner");
		//
		// const wrongData = abi.encode(["address"], [ethers.constants.AddressZero]);
		// await expect(
		// 	await ovmL2Instance.executeTransaction(target, value, signature, wrongData)
		// ).to.be.revertedWith("OptimisticTreasury::executeTransaction: Transaction execution reverted.");

		// await expect(await ovmL2Instance.executeTransaction(target, value, signature, data))
		// 	.to.emit(OTreasuryInstance, "TransactionExecuted")
		// 	.withArgs(target, value, signature, data);

		currentBalance = await daiTokenInstance.balanceOf(newOwner);
		expect(currentBalance).to.eq(amount);
	});
});
