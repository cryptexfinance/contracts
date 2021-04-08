import { ethers as ethershardhat, hardhatArguments } from "hardhat";
require("dotenv").config();

module.exports = async ({ deployments }: any) => {
    let initial_run = process.env.INITIAL_RUN == "true" ? true : false;
    if (hardhatArguments.network === "mainnet" && initial_run) {
        let rDAIHandler = await deployments.get("DAIRewardHandler");
        let rBTCHandler = await deployments.get("WBTCRewardHandler");
        let rWETHHandler = await deployments.get("WETHRewardHandler");
        let ctxDeployment = await deployments.get("Ctx");
        const reward = process.env.REWARD_AMOUNT as string;

        console.log("Adding rewards");
        let ctx = await ethershardhat.getContractAt(
            "Ctx",
            ctxDeployment.address
        );
        let target = rDAIHandler.address;
        await ctx.transfer(target, reward);
        target = rBTCHandler.address;
        await ctx.transfer(target, reward);
        target = rWETHHandler.address;
        await ctx.transfer(target, reward);
        // PENDING NOTIFYREWARD AMOUNTS
    }
};
module.exports.tags = ["Initialize"];
