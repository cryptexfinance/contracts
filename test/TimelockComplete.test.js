// CREATED TO TEST TIMELOCK COMPLETE FLOW

var expect = require("chai").expect;

describe("Timelock Complete process ETH", async function () {
	let timelockInstance;
	let governorAlphaInstance;
	let governorBetaInstance;
	let [owner, addr1, handler, handler2] = [];
	let accounts = [];
	const threeDays = 259200;
	const ONE_DAY = 86500;

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
		let nonce = await owner.getTransactionCount();
		const ctxAddress = ethers.utils.getContractAddress({
			from: accounts[0],
			nonce: nonce++,
		});
		const timelockAddress = ethers.utils.getContractAddress({
			from: accounts[0],
			nonce: nonce++,
		});
		const governorAddress = ethers.utils.getContractAddress({
			from: accounts[0],
			nonce: nonce++,
		});
		const ctx = await ethers.getContractFactory("Ctx");
		const ctxInstance = await ctx.deploy(accounts[0], accounts[0], 1640140333);
		await ctxInstance.deployed();

		const timelock = await ethers.getContractFactory("Timelock");
		timelockInstance = await timelock.deploy(governorAddress, threeDays);
		await timelockInstance.deployed();

		const governor = await ethers.getContractFactory("GovernorAlpha");
		governorAlphaInstance = await governor.deploy(timelockAddress, ctxAddress);
		await governorAlphaInstance.deployed();
		expect(governorAlphaInstance.address).to.eq(governorAddress);

		expect(governorAlphaInstance.address).properAddress;
		expect(timelockInstance.address).properAddress;
		await ctxInstance.deployed();
		//Delegates to self
		await ctxInstance.delegate(accounts[0]);
	});

	it("...should create proposal", async () => {
		// receive eth
		let receiver = accounts[2];
		const amount = ethers.utils.parseEther("70.02717516");
		const targets = [receiver];
		const values = [amount];
		const signatures = [""];
		const calldatas = [0x000000000000000000000000000000000000000000000000000000000000000000000000];
		const description = "CIP-2: Upgrade Governor";
		console.log(
			"balance of owner",
			ethers.utils.formatEther(await ethers.provider.getBalance(accounts[0]))
		);
		let balance = await ethers.provider.getBalance(receiver);
		console.log("Old Balance is: ", ethers.utils.formatEther(balance));
		await owner.sendTransaction({
			to: timelockInstance.address,
			value: ethers.utils.parseEther("9999"),
		});
		balance = await ethers.provider.getBalance(timelockInstance.address);
		expect(balance).to.eq(ethers.utils.parseEther("9999"));
		console.log(
			"=====================balance of timelock=============",
			ethers.utils.formatEther(await ethers.provider.getBalance(timelockInstance.address))
		);
		console.log("==================Create Proposal==================");
		// @ts-ignore
		let tx = await governorAlphaInstance.propose(
			targets,
			values,
			signatures,
			calldatas,
			description
		);
		// await ethers.provider.send("evm_increaseTime", [1]);
		await ethers.provider.send("evm_mine", []);
		// Vote
		console.log("==================Vote==================");
		tx = await governorAlphaInstance.castVote(1, true);
		console.log(tx);
		await ethers.provider.send("evm_mine", []);
		// Wait to queue
		console.log("==================Queue==================");
		//block.number <= proposal.endBlock
		let proposal = await governorAlphaInstance.proposals(1);
		console.log(".-.-.-.-.-.-Waiting for blocks to mine.-.-.-.-.-.-");
		for (let i = ethers.provider.blockNumber; i < proposal.endBlock; i++) {
			await ethers.provider.send("evm_mine", []);
		}
		tx = await governorAlphaInstance.queue(1);
		console.log(tx);
		await ethers.provider.send("evm_mine", []);
		// Execute transaction
		console.log("==================Execute Transaction==================");
		proposal = await governorAlphaInstance.proposals(1);
		await ethers.provider.send("evm_increaseTime", [ONE_DAY * 4]);
		await ethers.provider.send("evm_mine", []);
		tx = await governorAlphaInstance.connect(addr1).execute(1);
		console.log(tx);
		await ethers.provider.send("evm_mine", []);
		// Check Balance
		console.log("==================Check Balance==================");
		balance = await ethers.provider.getBalance(receiver);
		console.log("New Balance is: ", ethers.utils.formatEther(balance));
		console.log(
			"=====================balance of timelock=============",
			ethers.utils.formatEther(await ethers.provider.getBalance(timelockInstance.address))
		);
		// const blockN = await ethers.provider.getBlockNumber();
		// const currentBlock = await ethers.provider.getBlock(blockN);
		// const eta = currentBlock.timestamp + threeDays + 1;
		// await timelockInstance.queueTransaction(
		// 	receiver,
		// 	amount,
		// 	"()",
		// 	0x000000000000000000000000000000000000000000000000000000000000000000000000,
		// 	eta
		// );
		// console.log("==================Execute Transaction==================");
		// await ethers.provider.send("evm_increaseTime", [threeDays + 3]);
		// await ethers.provider.send("evm_mine", []);
		// tx = await timelockInstance.executeTransaction(
		// 	receiver,
		// 	amount,
		// 	"()",
		// 	0x000000000000000000000000000000000000000000000000000000000000000000000000,
		// 	eta
		// );
		// // console.log(tx);
		// await ethers.provider.send("evm_mine", []);
		// balance = await ethers.provider.getBalance(receiver);
		// console.log("New Balance is: ", ethers.utils.formatEther(balance));
	});
});
