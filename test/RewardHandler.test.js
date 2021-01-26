var expect = require("chai").expect;
var ethers = require("hardhat").ethers;

describe("Reward Handler", async () => {
	let rewardHandlerInstance, ercTokenInstance, rewardTokenInstance;
	let [owner, user, vault] = [];
	let ownerAddr, userAddr, vaultAddr;
	const ONE_DAY = 86400;

	before("Set Accounts", async () => {
		let [acc0, acc1, acc2] = await ethers.getSigners();
		user = acc0;
		owner = acc1;
		vault = acc2;
		ownerAddr = await owner.getAddress();
		userAddr = await user.getAddress();
		vaultAddr = await vault.getAddress();
	});

	it("...should deploy the contract", async () => {
		const collateral = await ethers.getContractFactory("WBTC");
		ercTokenInstance = await collateral.deploy();
		const reward = await ethers.getContractFactory("WBTC");
		rewardTokenInstance = await reward.deploy();

		// Initialize Vault

		const rewardHandler = await ethers.getContractFactory("RewardHandler");
		rewardHandlerInstance = await rewardHandler.deploy(
			ownerAddr,
			rewardTokenInstance.address,
			ercTokenInstance.address,
			await vaultAddr
		);
		await rewardHandlerInstance.deployed();
		expect(rewardHandlerInstance.address).properAddress;
	});

	it("...should set the constructor values", async () => {
		expect(ownerAddr).to.eq(await rewardHandlerInstance.owner());
		expect(rewardTokenInstance.address).to.eq(await rewardHandlerInstance.rewardsToken());
		expect(ercTokenInstance.address).to.eq(await rewardHandlerInstance.stakingToken());
	});

	it("...should allow a vault to stake for a user", async () => {
		let stakeAmount = ethers.utils.parseEther("100");
		let rewardAmount = ethers.utils.parseEther("100");

		await rewardTokenInstance.mint(ownerAddr, rewardAmount);

		await expect(
			rewardHandlerInstance.connect(user).stake(userAddr, stakeAmount)
		).to.be.revertedWith("RewardHandler::OnlyVault: not calling from vault");

		await expect(rewardHandlerInstance.connect(vault).stake(userAddr, 0)).to.be.revertedWith(
			"Cannot stake 0"
		);
		await expect(rewardHandlerInstance.connect(vault).stake(userAddr, stakeAmount))
			.to.emit(rewardHandlerInstance, "Staked")
			.withArgs(userAddr, stakeAmount);

		expect(await rewardHandlerInstance.totalSupply()).to.eq(stakeAmount);
		expect(await rewardHandlerInstance.balanceOf(userAddr)).to.eq(stakeAmount);
	});

	it("...should allow owner to fund the reward handler", async () => {
		let rewardAmount = ethers.utils.parseEther("100");
		// Make sure nothing is earned
		let _before = await rewardHandlerInstance.earned(userAddr);
		expect(_before).eq(0);

		//fast-forward
		await ethers.provider.send("evm_increaseTime", [ONE_DAY]);
		await ethers.provider.send("evm_mine", []);

		// No funds until we actually supply funds
		let _after = await rewardHandlerInstance.earned(userAddr);
		expect(_after).eq(_before);

		// Give rewards
		await rewardTokenInstance.connect(owner).transfer(rewardHandlerInstance.address, rewardAmount);
		await expect(rewardHandlerInstance.connect(owner).notifyRewardAmount(rewardAmount))
			.to.emit(rewardHandlerInstance, "RewardAdded")
			.withArgs(rewardAmount);

		let _rateBefore = await rewardHandlerInstance.getRewardForDuration();
		expect(_rateBefore > 0).to.be.true;
	});

	it("...should allow user to earn rewards", async () => {
		let _rateBefore = await rewardHandlerInstance.getRewardForDuration();
		let rewardAmount = ethers.utils.parseEther("100");

		//fast-forward
		let _before = await rewardHandlerInstance.earned(userAddr);
		await ethers.provider.send("evm_increaseTime", [ONE_DAY]);
		await ethers.provider.send("evm_mine", []);
		let _after = await rewardHandlerInstance.earned(userAddr);
		expect(_after.gt(_before)).to.be.true;
		expect(_after > 0).to.be.true;

		// Add more rewards, rate should increase
		await rewardTokenInstance.mint(ownerAddr, rewardAmount);
		await rewardTokenInstance.connect(owner).transfer(rewardHandlerInstance.address, rewardAmount);
		await rewardHandlerInstance.connect(owner).notifyRewardAmount(rewardAmount);

		let _rateAfter = await rewardHandlerInstance.getRewardForDuration();
		expect(_rateAfter.gt(_rateBefore)).to.be.true;
	});

	it("...should allow user to retrieve rewards", async () => {
		// Retrieve tokens
		let _balanceBefore = await rewardTokenInstance.balanceOf(userAddr);
		expect(_balanceBefore).to.eq(0);
		await expect(rewardHandlerInstance.connect(user).getReward()).to.emit(
			rewardHandlerInstance,
			"RewardPaid"
		);

		let _balanceAfter = await rewardTokenInstance.balanceOf(userAddr);
		expect(_balanceAfter.gt(_balanceBefore));
	});

	it("...should allow vault to withdraw", async () => {
		let stakeAmount = ethers.utils.parseEther("100");
		await expect(
			rewardHandlerInstance.connect(user).withdraw(userAddr, stakeAmount)
		).to.be.revertedWith("RewardHandler::OnlyVault: not calling from vault");

		await expect(rewardHandlerInstance.connect(vault).withdraw(userAddr, stakeAmount))
			.to.emit(rewardHandlerInstance, "Withdrawn")
			.withArgs(userAddr, stakeAmount);

		await expect(rewardHandlerInstance.connect(vault).withdraw(userAddr, 0)).to.be.revertedWith(
			"Cannot withdraw 0"
		);
		expect(await rewardHandlerInstance.totalSupply()).to.eq(0);
		expect(await rewardHandlerInstance.balanceOf(userAddr)).to.eq(0);
	});

	it("...should allow vault to exit", async () => {
		let stakeAmount = ethers.utils.parseEther("100");
		await rewardHandlerInstance.connect(vault).stake(userAddr, stakeAmount);

		await expect(rewardHandlerInstance.connect(user).exit(userAddr)).to.be.revertedWith(
			"RewardHandler::OnlyVault: not calling from vault"
		);

		let _balanceBefore = await rewardTokenInstance.balanceOf(userAddr);
		await expect(rewardHandlerInstance.connect(vault).exit(userAddr))
			.to.emit(rewardHandlerInstance, "Withdrawn")
			.withArgs(userAddr, stakeAmount);
		let _balanceAfter = await rewardTokenInstance.balanceOf(userAddr);

		expect(_balanceAfter.gt(_balanceBefore));
		expect(await rewardHandlerInstance.totalSupply()).to.eq(0);
		expect(await rewardHandlerInstance.balanceOf(userAddr)).to.eq(0);
	});

	it("...shouldn't allow to earn after period finish ", async () => {
		let stakeAmount = ethers.utils.parseEther("100");
		await rewardHandlerInstance.connect(vault).stake(userAddr, stakeAmount);

		// Warp to period finish
		let periodFinish = await rewardHandlerInstance.periodFinish();
		await ethers.provider.send("evm_setNextBlockTimestamp", [
			parseInt(periodFinish.add(ONE_DAY).toString()),
		]);
		await ethers.provider.send("evm_mine", []);
		await rewardHandlerInstance.connect(user).getReward();

		await ethers.provider.send("evm_increaseTime", [ONE_DAY]);
		await ethers.provider.send("evm_mine", []);

		let _after = await rewardHandlerInstance.earned(userAddr);
		// Earn 0 after period finished
		expect(_after).to.eq(0);
	});
});
