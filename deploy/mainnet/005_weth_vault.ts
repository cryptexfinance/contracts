import { hardhatArguments } from "hardhat";
import { deployments } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const WETHVaultHandler = async (hre: HardhatRuntimeEnvironment) => {
    let initial_run = process.env.INITIAL_RUN == "true" ? true : false;
    if (hardhatArguments.network === "mainnet" && initial_run) {
        const { log } = deployments;
        const namedAccounts = await hre.getNamedAccounts();
        const deployer = namedAccounts.deployer;
        const ethers = hre.ethers;

        const [owner] = await ethers.getSigners();

        let handlerContract;
        let orchestrator = await deployments.get("Orchestrator");
        let ctx = await deployments.get("Ctx");
        try {
            handlerContract = await deployments.get("WETHVaultHandler");
        } catch (error) {
            log(error.message);
            try {
                let tcap = await deployments.get("TCAP");

                let WETHContract = process.env.WETH_TOKEN as string;

                let divisor = process.env.DIVISOR as string;
                let ratio = process.env.RATIO as string;
                let burnFee = process.env.BURN_FEE as string;
                let liquidationPenalty = process.env
                    .LIQUIDATION_PENALTY as string;
                const guardian = process.env.GUARDIAN;

                let tcapOracle = await deployments.get("TCAPOracle");
                let priceFeedETH = await deployments.get("WETHOracle");
                const timelock = await deployments.get("Timelock");
                let nonce = await owner.getTransactionCount();

                const vaultAddress = ethers.utils.getContractAddress({
                    from: deployer,
                    nonce: nonce++,
                });

                const rewardAddress = ethers.utils.getContractAddress({
                    from: deployer,
                    nonce: nonce++,
                });

                const deployResult = await deployments.deploy(
                    "WETHVaultHandler",
                    {
                        from: deployer,
                        contract: "ETHVaultHandler",
                        args: [
                            orchestrator.address,
                            divisor,
                            ratio,
                            burnFee,
                            liquidationPenalty,
                            tcapOracle.address,
                            tcap.address,
                            WETHContract,
                            priceFeedETH.address,
                            priceFeedETH.address,
                            rewardAddress,
                            timelock.address,
                        ],
                    }
                );
                handlerContract = await deployments.get("WETHVaultHandler");
                if (deployResult.newlyDeployed) {
                    log(
                        `WETHVaultHandler deployed at ${handlerContract.address} for ${deployResult.receipt?.gasUsed}`
                    );
                }
                const rewardDeployment = await deployments.deploy(
                    "WETHRewardHandler",
                    {
                        contract: "RewardHandler",
                        from: deployer,
                        args: [guardian, ctx.address, vaultAddress],
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
export default WETHVaultHandler;
