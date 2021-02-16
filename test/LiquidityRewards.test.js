var expect = require("chai").expect;
var ethers = require("hardhat").ethers;

describe("Liquidity Mining Reward", async () => {
	let liquidityRewardInstance, stakingTokenInstance, rewardTokenInstance;
	let [owner, user, vault] = [];
	let ownerAddr, userAddr;
	let vestingBegin;
	let vestingEnd;
	let vestingRatio = 30;
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
		stakingTokenInstance = await collateral.deploy();
		const reward = await ethers.getContractFactory("WBTC");
		rewardTokenInstance = await reward.deploy();

		// Vesting
		const { timestamp: now } = await ethers.provider.getBlock("latest");
		vestingBegin = now + 60;
		vestingEnd = vestingBegin + 60 * 60 * 24 * 182;

		// Initialize Vault

		const liquidityReward = await ethers.getContractFactory("LiquidityReward");
		liquidityRewardInstance = await liquidityReward.deploy(
			ownerAddr,
			rewardTokenInstance.address,
			stakingTokenInstance.address,
			vestingBegin,
			vestingEnd,
			vestingRatio
		);
		await liquidityRewardInstance.deployed();
		expect(liquidityRewardInstance.address).properAddress;
	});

	it("...should set the constructor values", async () => {
		expect(ownerAddr).to.eq(await liquidityRewardInstance.owner());
		expect(rewardTokenInstance.address).to.eq(await liquidityRewardInstance.rewardsToken());
		expect(stakingTokenInstance.address).to.eq(await liquidityRewardInstance.stakingToken());
		expect(vestingBegin).to.eq(await liquidityRewardInstance.vestingBegin());
		expect(vestingEnd).to.eq(await liquidityRewardInstance.vestingEnd());
		expect(vestingRatio).to.eq(await liquidityRewardInstance.vestingRatio());
	});

	it("...should allow an user to stake", async () => {
		let stakeAmount = ethers.utils.parseEther("100");
		let rewardAmount = ethers.utils.parseEther("100");

		await rewardTokenInstance.mint(ownerAddr, rewardAmount);
		await stakingTokenInstance.mint(userAddr, rewardAmount);
		await stakingTokenInstance.connect(user).approve(liquidityRewardInstance.address, stakeAmount);

		await expect(liquidityRewardInstance.connect(user).stake(0)).to.be.revertedWith(
			"Cannot stake 0"
		);

		await expect(liquidityRewardInstance.connect(user).stake(stakeAmount))
			.to.emit(liquidityRewardInstance, "Staked")
			.withArgs(userAddr, stakeAmount);

		expect(await liquidityRewardInstance.totalSupply()).to.eq(stakeAmount);
		expect(await liquidityRewardInstance.balanceOf(userAddr)).to.eq(stakeAmount);
	});

	it("...should allow owner to fund the reward handler", async () => {
		let rewardAmount = ethers.utils.parseEther("100");
		// Make sure nothing is earned
		let _before = await liquidityRewardInstance.earned(userAddr);
		expect(_before).eq(0);

		//fast-forward
		await ethers.provider.send("evm_increaseTime", [ONE_DAY]);
		await ethers.provider.send("evm_mine", []);

		// No funds until we actually supply funds
		let _after = await liquidityRewardInstance.earned(userAddr);
		expect(_after).eq(_before);

		// Give rewards
		await rewardTokenInstance
			.connect(owner)
			.transfer(liquidityRewardInstance.address, rewardAmount);
		await expect(liquidityRewardInstance.connect(owner).notifyRewardAmount(rewardAmount))
			.to.emit(liquidityRewardInstance, "RewardAdded")
			.withArgs(rewardAmount);

		let _rateBefore = await liquidityRewardInstance.getRewardForDuration();
		expect(_rateBefore > 0).to.be.true;
	});

	it("...should allow user to earn rewards", async () => {
		let _rateBefore = await liquidityRewardInstance.getRewardForDuration();
		let rewardAmount = ethers.utils.parseEther("100");

		//fast-forward
		let _before = await liquidityRewardInstance.earned(userAddr);
		await ethers.provider.send("evm_increaseTime", [ONE_DAY]);
		await ethers.provider.send("evm_mine", []);
		let _after = await liquidityRewardInstance.earned(userAddr);
		expect(_after.gt(_before)).to.be.true;
		expect(_after > 0).to.be.true;

		// Add more rewards, rate should increase
		await rewardTokenInstance.mint(ownerAddr, rewardAmount);
		await rewardTokenInstance
			.connect(owner)
			.transfer(liquidityRewardInstance.address, rewardAmount);
		await liquidityRewardInstance.connect(owner).notifyRewardAmount(rewardAmount);

		let _rateAfter = await liquidityRewardInstance.getRewardForDuration();
		expect(_rateAfter.gt(_rateBefore)).to.be.true;
	});

	it("...should allow user to retrieve rewards", async () => {
		// Retrieve tokens
		let _balanceBefore = await rewardTokenInstance.balanceOf(userAddr);
		expect(_balanceBefore).to.eq(0);
		let beforeReward = await liquidityRewardInstance.earned(userAddr);
		await expect(liquidityRewardInstance.connect(user).getReward()).to.emit(
			liquidityRewardInstance,
			"RewardPaid"
		);

		let _balanceAfter = await rewardTokenInstance.balanceOf(userAddr);
		let _vestingAmounts = await liquidityRewardInstance.vestingAmounts(userAddr);
		expect(_balanceAfter.add(_vestingAmounts)).to.gt(beforeReward);
		expect(_balanceAfter).to.lt(beforeReward);
		expect(_balanceAfter.gt(beforeReward));
	});

	it("...should allow user to withdraw", async () => {
		let stakeAmount = ethers.utils.parseEther("100");
		await expect(liquidityRewardInstance.connect(vault).withdraw(0)).to.be.revertedWith(
			"Cannot withdraw 0"
		);
		await expect(liquidityRewardInstance.connect(user).withdraw(stakeAmount))
			.to.emit(liquidityRewardInstance, "Withdrawn")
			.withArgs(userAddr, stakeAmount);

		expect(await liquidityRewardInstance.totalSupply()).to.eq(0);
		expect(await liquidityRewardInstance.balanceOf(userAddr)).to.eq(0);
	});

	it("...should allow vault to exit", async () => {
		let stakeAmount = ethers.utils.parseEther("100");
		await stakingTokenInstance.connect(user).approve(liquidityRewardInstance.address, stakeAmount);
		await liquidityRewardInstance.connect(user).stake(stakeAmount);

		let _balanceBefore = await rewardTokenInstance.balanceOf(userAddr);
		await expect(liquidityRewardInstance.connect(user).exit())
			.to.emit(liquidityRewardInstance, "Withdrawn")
			.withArgs(userAddr, stakeAmount);
		let _balanceAfter = await rewardTokenInstance.balanceOf(userAddr);

		expect(_balanceAfter.gt(_balanceBefore));
		expect(await liquidityRewardInstance.totalSupply()).to.eq(0);
		expect(await liquidityRewardInstance.balanceOf(userAddr)).to.eq(0);
	});

	it("...shouldn't allow to earn after period finish ", async () => {
		let stakeAmount = ethers.utils.parseEther("100");
		await stakingTokenInstance.connect(user).approve(liquidityRewardInstance.address, stakeAmount);
		await liquidityRewardInstance.connect(user).stake(stakeAmount);

		// Warp to period finish
		let periodFinish = await liquidityRewardInstance.periodFinish();
		await ethers.provider.send("evm_setNextBlockTimestamp", [
			parseInt(periodFinish.add(ONE_DAY).toString()),
		]);
		await ethers.provider.send("evm_mine", []);
		await liquidityRewardInstance.connect(user).getReward();

		await ethers.provider.send("evm_increaseTime", [ONE_DAY]);
		await ethers.provider.send("evm_mine", []);

		let _after = await liquidityRewardInstance.earned(userAddr);
		// Earn 0 after period finished
		expect(_after).to.eq(0);
	});

	it("...should allow to claim vesting after vesting time", async () => {
		await expect(liquidityRewardInstance.connect(user).claimVest()).to.be.revertedWith(
			"LiquidityReward::claimVest: not time yet"
		);

		let _balanceBefore = await rewardTokenInstance.balanceOf(userAddr);
		await ethers.provider.send("evm_increaseTime", [ONE_DAY * 31 * 6]);
		await ethers.provider.send("evm_mine", []);
		await liquidityRewardInstance.connect(user).claimVest();
		let _balanceAfter = await rewardTokenInstance.balanceOf(userAddr);
		expect(_balanceAfter.gt(_balanceBefore));
		let _vestingAmounts = await liquidityRewardInstance.vestingAmounts(userAddr);
		expect(_vestingAmounts).to.eq(0);
	});
});
