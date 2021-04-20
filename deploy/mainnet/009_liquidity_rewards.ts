import { ethers as ethershardhat, hardhatArguments } from "hardhat";
import { deployments } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
require("dotenv").config();

module.exports = async (hre: HardhatRuntimeEnvironment) => {
    if (hardhatArguments.network === "mainnet") {
        const LP = await deployments.getOrNull("CTXLiquidityReward");

        if (!LP) {
            const namedAccounts = await hre.getNamedAccounts();
            const deployer = namedAccounts.deployer;

            const { log } = deployments;

            let ctxDeployment = await deployments.get("Ctx");
            // let timelock = await deployments.get("Timelock");

            // TODO: Check This values
            let vestingRatio = "70"; //process.env.VESTING_RATIO;
            const vestingEnd = 1634511237; // 2021-10-17T22:53:57.000Z
            let rewardsToken = ctxDeployment.address;
            let stakingToken = "0x2a93167ed63a31f35ca4788e2eb9fbd9fa6089d0"; // process.env.LP_CTX_ETH;
            const guardian = "0xa70b638b70154edfcbb8dbbbd04900f328f32c35"; // process.env.GUARDIAN;

            // let reward = process.env.LP_REWARD as string;
            // let rewardWei = ethershardhat.utils.parseEther(reward);

            console.log("deploying liquidity rewards for CTX/ETH LP");

            //ETH
            let rewardDeployment = await deployments.deploy(
                "CTXLiquidityReward",
                {
                    contract: "LiquidityReward",
                    from: deployer,
                    args: [
                        guardian,
                        rewardsToken,
                        stakingToken,
                        vestingEnd,
                        vestingRatio,
                    ],
                }
            );
            log(
                `Liquidity Reward deployed at ${rewardDeployment.address} for ${rewardDeployment.receipt?.gasUsed}`
            );
        }

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
