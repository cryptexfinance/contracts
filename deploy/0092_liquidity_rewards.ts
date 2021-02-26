import { ethers as ethershardhat, hardhatArguments } from "hardhat";
import { deployments } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
require("dotenv").config();

module.exports = async (hre: HardhatRuntimeEnvironment) => {
	let initial_run = process.env.INITIAL_RUN == "false" ? true : false;

	if (
		(hardhatArguments.network === "rinkeby" ||
			hardhatArguments.network === "ropsten" ||
			hardhatArguments.network === "hardhat" ||
			hardhatArguments.network === "ganache") &&
		initial_run
	) {
		const ethers = hre.ethers;
		const namedAccounts = await hre.getNamedAccounts();
		const deployer = namedAccounts.deployer;
		const { log } = deployments;
		let OrchestratorDeployment = await deployments.get("Orchestrator");
		let ctxDeployment = await deployments.get("Ctx");
		let timelock = await deployments.get("Timelock");

		let vestingRatio = process.env.VESTING_RATIO;
		const { timestamp: now } = await ethers.provider.getBlock("latest");
		const vestingBegin = now + 60;
		const vestingEnd = vestingBegin + 60 * 60 * 24 * 182;
		let rewardsToken = ctxDeployment.address;
		let stakingToken = process.env.UNI_TCAP_ETH;

		let rewardAmount = ethershardhat.utils.parseEther("400000");
		const abi = new ethershardhat.utils.AbiCoder();

		const value = 0;
		const signature = "notifyRewardAmount(uint256)";
		const data = abi.encode(["uint256"], [rewardAmount]);
		let orchestrator = await ethershardhat.getContractAt(
			"Orchestrator",
			OrchestratorDeployment.address
		);

		console.log("deploying liquidity rewards");

		//ETH
		let rewardDeployment = await deployments.deploy("ETHLiquidityReward", {
			contract: "LiquidityReward",
			from: deployer,
			args: [
				OrchestratorDeployment.address,
				rewardsToken,
				stakingToken,
				vestingBegin,
				vestingEnd,
				vestingRatio,
			],
		});
		log(
			`Liquidity Reward deployed at ${rewardDeployment.address} for ${rewardDeployment.receipt?.gasUsed}`
		);

		console.log("Adding rewards");

		let ctx = await ethershardhat.getContractAt("Ctx", ctxDeployment.address);
		let target = rewardDeployment.address;

		await ctx.transfer(target, rewardAmount);
		await orchestrator.executeTransaction(target, value, signature, data, { gasLimit: 4000000 });

		/// WBTC
		stakingToken = process.env.UNI_TCAP_WBTC;
		rewardDeployment = await deployments.deploy("WBTCLiquidityReward", {
			contract: "LiquidityReward",
			from: deployer,
			args: [
				OrchestratorDeployment.address,
				rewardsToken,
				stakingToken,
				vestingBegin,
				vestingEnd,
				vestingRatio,
			],
		});
		log(
			`Liquidity Reward deployed at ${rewardDeployment.address} for ${rewardDeployment.receipt?.gasUsed}`
		);

		console.log("Adding rewards");

		target = rewardDeployment.address;

		await ctx.transfer(target, rewardAmount);
		await orchestrator.executeTransaction(target, value, signature, data, { gasLimit: 4000000 });

		// DAI
		stakingToken = process.env.UNI_TCAP_DAI;
		rewardDeployment = await deployments.deploy("DAILiquidityReward", {
			contract: "LiquidityReward",
			from: deployer,
			args: [
				OrchestratorDeployment.address,
				rewardsToken,
				stakingToken,
				vestingBegin,
				vestingEnd,
				vestingRatio,
			],
		});
		log(
			`Liquidity Reward deployed at ${rewardDeployment.address} for ${rewardDeployment.receipt?.gasUsed}`
		);

		console.log("Adding rewards");

		target = rewardDeployment.address;

		await ctx.transfer(target, rewardAmount);
		await orchestrator.executeTransaction(target, value, signature, data, { gasLimit: 4000000 });

		//CTX
		stakingToken = process.env.UNI_CTX_ETH;
		rewardDeployment = await deployments.deploy("CTXLiquidityReward", {
			contract: "LiquidityReward",
			from: deployer,
			args: [
				OrchestratorDeployment.address,
				rewardsToken,
				stakingToken,
				vestingBegin,
				vestingEnd,
				vestingRatio,
			],
		});
		log(
			`Liquidity Reward deployed at ${rewardDeployment.address} for ${rewardDeployment.receipt?.gasUsed}`
		);

		console.log("Adding rewards");

		target = rewardDeployment.address;

		await ctx.transfer(target, rewardAmount);
		await orchestrator.executeTransaction(target, value, signature, data, { gasLimit: 4000000 });

		//Transfer ownership
		await orchestrator.transferOwnership(timelock.address);
	}
};
module.exports.tags = ["Initialize"];
