import { ethers as ethershardhat, hardhatArguments } from "hardhat";
import { deployments } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
require("dotenv").config();

module.exports = async (hre: HardhatRuntimeEnvironment) => {
    let initial_run = process.env.INITIAL_RUN == "false" ? true : false;

    if (hardhatArguments.network === "mainnet" && initial_run) {
        const namedAccounts = await hre.getNamedAccounts();
        const deployer = namedAccounts.deployer;

        const { log } = deployments;

        let ctxDeployment = await deployments.get("Ctx");
        // let timelock = await deployments.get("Timelock");

        let vestingRatio = process.env.VESTING_RATIO;

        const vestingEnd = 1633658400; //  Fri Oct 08 2021 02:00:00 GMT+0000
        let rewardsToken = ctxDeployment.address;
        let stakingToken = process.env.LP_TCAP_ETH;
        const guardian = process.env.GUARDIAN;

        // let reward = process.env.LP_REWARD as string;
        // let rewardWei = ethershardhat.utils.parseEther(reward);

        console.log("deploying liquidity rewards");

        //ETH
        let rewardDeployment = await deployments.deploy("ETHLiquidityReward", {
            contract: "LiquidityReward",
            from: deployer,
            args: [
                guardian,
                rewardsToken,
                stakingToken,
                vestingEnd,
                vestingRatio,
            ],
        });
        log(
            `Liquidity Reward deployed at ${rewardDeployment.address} for ${rewardDeployment.receipt?.gasUsed}`
        );

        // console.log("Adding rewards");

        // let ctx = await ethershardhat.getContractAt(
        //     "Ctx",
        //     ctxDeployment.address
        // );
        // let target = rewardDeployment.address;

        // await ctx.transfer(target, rewardWei);

        // /// WBTC
        // stakingToken = process.env.LP_TCAP_WBTC;
        // rewardDeployment = await deployments.deploy("WBTCLiquidityReward", {
        //     contract: "LiquidityReward",
        //     from: deployer,
        //     args: [
        //         guardian,
        //         rewardsToken,
        //         stakingToken,
        //         vestingEnd,
        //         vestingRatio,
        //     ],
        // });
        // log(
        //     `Liquidity Reward deployed at ${rewardDeployment.address} for ${rewardDeployment.receipt?.gasUsed}`
        // );

        // console.log("Adding rewards");

        // target = rewardDeployment.address;

        // await ctx.transfer(target, rewardWei);

        // // DAI
        // stakingToken = process.env.LP_TCAP_DAI;
        // rewardDeployment = await deployments.deploy("DAILiquidityReward", {
        //     contract: "LiquidityReward",
        //     from: deployer,
        //     args: [
        //         guardian,
        //         rewardsToken,
        //         stakingToken,
        //         vestingEnd,
        //         vestingRatio,
        //     ],
        // });
        // log(
        //     `Liquidity Reward deployed at ${rewardDeployment.address} for ${rewardDeployment.receipt?.gasUsed}`
        // );

        // console.log("Adding rewards");

        // target = rewardDeployment.address;

        // await ctx.transfer(target, rewardWei);

        // //CTX
        // stakingToken = process.env.LP_CTX_ETH;
        // rewardDeployment = await deployments.deploy("CTXLiquidityReward", {
        //     contract: "LiquidityReward",
        //     from: deployer,
        //     args: [
        //         guardian,
        //         rewardsToken,
        //         stakingToken,
        //         vestingEnd,
        //         vestingRatio,
        //     ],
        // });
        // log(
        //     `Liquidity Reward deployed at ${rewardDeployment.address} for ${rewardDeployment.receipt?.gasUsed}`
        // );

        // console.log("Adding rewards");

        // target = rewardDeployment.address;

        // await ctx.transfer(target, rewardWei);

        //Transfer ownership
        // let OrchestratorDeployment = await deployments.get("Orchestrator");
        // let orchestrator = await ethershardhat.getContractAt(
        //     "Orchestrator",
        //     OrchestratorDeployment.address
        // );

        // await orchestrator.transferOwnership(timelock.address);

        // PENDING NOTIFYREWARD AMOUNTS
    }
};
module.exports.tags = ["Initialize"];
