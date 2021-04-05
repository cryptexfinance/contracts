import { ethers as ethershardhat, hardhatArguments } from "hardhat";
require("dotenv").config();

module.exports = async ({ deployments }: any) => {
	let initial_run = process.env.INITIAL_RUN == "true" ? true : false;
	if (
		(hardhatArguments.network === "rinkeby" ||
			hardhatArguments.network === "ropsten" ||
			hardhatArguments.network === "hardhat" ||
			hardhatArguments.network === "ganache") &&
		initial_run
	) {
		let rDAIHandler = await deployments.get("DAIRewardHandler");
		let rBTCHandler = await deployments.get("BTCRewardHandler");
		let rWETHHandler = await deployments.get("WETHRewardHandler");
		let OrchestratorDeployment = await deployments.get("Orchestrator");
		let ctxDeployment = await deployments.get("Ctx");

		let rewardAmount = ethershardhat.utils.parseEther("500000");
		const abi = new ethershardhat.utils.AbiCoder();

		const value = 0;
		const signature = "notifyRewardAmount(uint256)";
		const data = abi.encode(["uint256"], [rewardAmount]);
		let orchestrator = await ethershardhat.getContractAt(
			"Orchestrator",
			OrchestratorDeployment.address
		);

		console.log("Adding rewards");

		let ctx = await ethershardhat.getContractAt("Ctx", ctxDeployment.address);
		let target = rDAIHandler.address;

		await ctx.transfer(target, rewardAmount);
		await orchestrator.executeTransaction(target, value, signature, data, { gasLimit: 4000000 });

		target = rBTCHandler.address;

		await ctx.transfer(target, rewardAmount);
		await orchestrator.executeTransaction(target, value, signature, data, { gasLimit: 4000000 });

		target = rWETHHandler.address;

		await ctx.transfer(target, rewardAmount);
		await orchestrator.executeTransaction(target, value, signature, data, { gasLimit: 4000000 });

		console.log("no transfer");
	}
};
module.exports.tags = ["Initialize"];
