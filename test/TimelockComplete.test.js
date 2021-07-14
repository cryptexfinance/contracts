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
	let governor;

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

		const governorA = await ethers.getContractFactory("GovernorAlpha");
		governorAlphaInstance = await governorA.deploy(timelockAddress, ctxAddress);
		await governorAlphaInstance.deployed();
		expect(governorAlphaInstance.address).to.eq(governorAddress);

		const governorB = await ethers.getContractFactory("GovernorBeta");
		governorBetaInstance = await governorB.deploy(timelockAddress, ctxAddress, accounts[0]);
		await governorBetaInstance.deployed();

		expect(governorAlphaInstance.address).properAddress;
		expect(timelockInstance.address).properAddress;
		await ctxInstance.deployed();
		//Delegates to self
		await ctxInstance.delegate(accounts[0]);
	});

	it("...should migrate governor", async () => {
		const abi = new ethers.utils.AbiCoder();
		const targets = [timelockInstance.address];
		const values = [0];
		const signatures = ["setPendingAdmin(address)"];
		const calldatas = [abi.encode(["address"], [governorBetaInstance.address])];
		const description = "CIP-2: Upgrade Governor";
		expect(await timelockInstance.admin()).to.eq(governorAlphaInstance.address);
		// Create Proposal
		await createProposal(targets, values, signatures, calldatas, description);

		// Vote
		await castVote(1, true);

		// Wait to queue
		await queueProposal(1);

		// Execute transaction
		await executeProposal(1);

		//Accept admin
		await governorBetaInstance.acceptTimelockAdmin();

		expect(await timelockInstance.admin()).to.eq(governorBetaInstance.address);
	});

	it("...should transfer eth", async () => {
		const timelockBalance = ethers.utils.parseEther("100");
		await owner.sendTransaction({
			to: timelockInstance.address,
			value: timelockBalance,
		});
		expect(await ethers.provider.getBalance(timelockInstance.address)).to.eq(timelockBalance);
		// receive eth
		let receiver = accounts[2];
		const amount = ethers.utils.parseEther("70.02717516");
		const targets = [receiver];
		const values = [amount];
		const signatures = [""];
		const calldatas = [0x000000000000000000000000000000000000000000000000000000000000000000000000];
		const description = "CIP-3: Transfer ETH";

		// changes the contract to call
		changeGovernor(governorBetaInstance);
		const oldBalance = await ethers.provider.getBalance(receiver);

		await createProposal(targets, values, signatures, calldatas, description);

		// Vote
		await castVote(1, true);

		// Wait to queue
		await queueProposal(1);

		// Execute transaction
		await executeProposal(1);

		const newBalance = await ethers.provider.getBalance(receiver);
		expect(newBalance).to.eq(oldBalance.add(amount));

		expect(await ethers.provider.getBalance(timelockInstance.address)).to.eq(
			timelockBalance.sub(amount)
		);
	});

	function initialize() {
		governor = governorAlphaInstance;
	}

	function changeGovernor(newGovernor) {
		governor = newGovernor;
	}

	async function createProposal(targets, values, signatures, calldatas, description) {
		if (!governor) {
			initialize();
		}
		const tx = await governor.propose(targets, values, signatures, calldatas, description);
		await ethers.provider.send("evm_mine", []);
	}

	async function castVote(proposalId, support) {
		if (!governor) {
			initialize();
		}
		await governor.castVote(proposalId, support);
		await ethers.provider.send("evm_mine", []);
	}

	async function queueProposal(proposalId) {
		if (!governor) {
			initialize();
		}

		const proposal = await governor.proposals(proposalId);
		await waitBlocks(ethers.provider.blockNumber, proposal.endBlock);
		await governor.queue(proposalId);
		await ethers.provider.send("evm_mine", []);
	}

	async function executeProposal(proposalId) {
		if (!governor) {
			initialize();
		}

		const ONE_DAY = 86500;
		await ethers.provider.send("evm_increaseTime", [ONE_DAY * 4]);
		await ethers.provider.send("evm_mine", []);
		await governor.execute(proposalId);
		await ethers.provider.send("evm_mine", []);
	}

	async function waitBlocks(start, end) {
		console.log(".-.-.-.-.-.-Waiting for blocks to mine.-.-.-.-.-.-");
		for (let i = start; i < end; i++) {
			await ethers.provider.send("evm_mine", []);
		}
	}
});
