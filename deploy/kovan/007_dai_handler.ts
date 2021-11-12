import { hardhatArguments } from "hardhat";
import { deployments } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const DAIVaultHandler = async (hre: HardhatRuntimeEnvironment) => {
    if (hardhatArguments.network === "kovan") {
        const { log } = deployments;
        const namedAccounts = await hre.getNamedAccounts();
        const deployer = namedAccounts.deployer;
        const ethers = hre.ethers;
        const [owner] = await ethers.getSigners();

        let handlerContract;
        let orchestrator = await deployments.get("Orchestrator");
        let ctx = await deployments.get("Ctx");
        try {
            handlerContract = await deployments.get("DAIVaultHandler");
        } catch (error) {
            try {
                let tcap = await deployments.get("TCAP");

                let DAIContract = await deployments.get("DAI");

                let divisor = process.env.DIVISOR as string;
                let ratio = process.env.RATIO as string;
                let burnFee = process.env.BURN_FEE as string;
                let liquidationPenalty = process.env
                    .LIQUIDATION_PENALTY as string;

                let tcapOracle = await deployments.get("TCAPOracle");
                let priceFeedETH = await deployments.get("WETHOracle");
                let priceFeedDAI = await deployments.get("DAIOracle");
                let nonce = await owner.getTransactionCount();

                const vaultAddress = ethers.utils.getContractAddress({
                    from: deployer,
                    nonce: nonce++,
                });

                const rewardAddress = ethers.utils.getContractAddress({
                    from: deployer,
                    nonce: nonce++,
                });
                const timelock = await deployments.get("Timelock");
                const deployResult = await deployments.deploy(
                    "DAIVaultHandler",
                    {
                        from: deployer,
                        contract: "ERC20VaultHandler",
                        args: [
                            orchestrator.address,
                            divisor,
                            ratio,
                            burnFee,
                            liquidationPenalty,
                            tcapOracle.address,
                            tcap.address,
                            DAIContract.address,
                            priceFeedDAI.address,
                            priceFeedETH.address,
                            rewardAddress,
                            timelock.address,
                        ],
                    }
                );
                handlerContract = await deployments.get("DAIVaultHandler");
                if (deployResult.newlyDeployed) {
                    log(
                        `DAIVaultHandler deployed at ${handlerContract.address} for ${deployResult.receipt?.gasUsed}`
                    );
                }
                const rewardDeployment = await deployments.deploy(
                    "DAIRewardHandler",
                    {
                        contract: "RewardHandler",
                        from: deployer,
                        args: [orchestrator.address, ctx.address, vaultAddress],
                    }
                );
                log(
                    `Reward Handler deployed at ${rewardDeployment.address} for ${rewardDeployment.receipt?.gasUsed}`
                );
            } catch (error) {
                log(error.message);
            }
        }
    }
};
export default DAIVaultHandler;
