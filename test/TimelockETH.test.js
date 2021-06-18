// var expect = require("chai").expect;
// var ethersProvider = require("ethers");

// describe("Timelock ETH", async function () {
// 	let timelockInstance;
// 	let [owner, addr1, handler, handler2] = [];
// 	let accounts = [];
// 	const threeDays = 259200;

// 	before("Set Accounts", async () => {
// 		let [acc0, acc1, acc3, acc4, acc5] = await ethers.getSigners();
// 		owner = acc0;
// 		addr1 = acc1;
// 		handler = acc3;
// 		handler2 = acc4;
// 		if (owner && addr1 && handler) {
// 			accounts.push(await owner.getAddress());
// 			accounts.push(await addr1.getAddress());
// 			accounts.push(await handler.getAddress());
// 			accounts.push(await handler2.getAddress());
// 			accounts.push(await acc5.getAddress());
// 		}
// 	});

// 	it("...should deploy the contract", async () => {
// 		const timelock = await ethers.getContractFactory("Timelock");
// 		timelockInstance = await timelock.deploy(accounts[0], threeDays);
// 		await timelockInstance.deployed();
// 		expect(timelockInstance.address).properAddress;
// 	});

// 	it("...should send eth directly from owner", async () => {
// 		// receive eth
// 		let receiver = accounts[2];
// 		const amount = ethers.utils.parseEther("70.02717516");
// 		let balance = await ethers.provider.getBalance(receiver);

// 		console.log("Old Balance is: ", ethers.utils.formatEther(balance));
// 		await owner.sendTransaction({
// 			to: timelockInstance.address,
// 			value: ethers.utils.parseEther("9999"),
// 		});
// 		balance = await ethers.provider.getBalance(timelockInstance.address);
// 		console.log(
// 			"balance of owner",
// 			ethers.utils.formatEther(await ethers.provider.getBalance(accounts[0]))
// 		);
// 		expect(balance).to.eq(ethers.utils.parseEther("9999"));

// 		const blockN = await ethers.provider.getBlockNumber();
// 		const currentBlock = await ethers.provider.getBlock(blockN);
// 		const eta = currentBlock.timestamp + threeDays + 1;

// 		await timelockInstance.queueTransaction(
// 			receiver,
// 			amount,
// 			"()",
// 			0x000000000000000000000000000000000000000000000000000000000000000000000000,
// 			eta
// 		);

// 		console.log("==================Execute Transaction==================");
// 		await ethers.provider.send("evm_increaseTime", [threeDays + 3]);
// 		await ethers.provider.send("evm_mine", []);
// 		let tx = await timelockInstance.executeTransaction(
// 			receiver,
// 			amount,
// 			"()",
// 			0x000000000000000000000000000000000000000000000000000000000000000000000000,
// 			eta
// 		);
// 		// console.log(tx);
// 		await ethers.provider.send("evm_mine", []);

// 		balance = await ethers.provider.getBalance(receiver);
// 		console.log("New Balance is: ", ethers.utils.formatEther(balance));
// 	});
// });
