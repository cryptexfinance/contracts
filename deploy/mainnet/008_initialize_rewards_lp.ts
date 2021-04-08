import { ethers as ethershardhat, hardhatArguments } from "hardhat";
require("dotenv").config();

module.exports = async ({ deployments }: any) => {
    // let initial_run = process.env.INITIAL_RUN == "true" ? true : false;
    if (hardhatArguments.network === "mainnet") {
        let rLPWETHHandler = await deployments.get("ETHLiquidityReward");
        let ctxDeployment = await deployments.get("Ctx");
        const reward = process.env.LP_REWARD as string;

        console.log("Adding LP rewards");
        let ctx = await ethershardhat.getContractAt(
            "Ctx",
            ctxDeployment.address
        );

        let target = rLPWETHHandler.address;
        await ctx.transfer(target, reward);
        // PENDING NOTIFYREWARD AMOUNTS
    }
};
module.exports.tags = ["Initialize"];
