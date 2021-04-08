import { hardhatArguments } from "hardhat";
import { deployments } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const BTCVaultHandler = async (hre: HardhatRuntimeEnvironment) => {
    let initial_run = process.env.INITIAL_RUN == "true" ? true : false;
    if (
        (hardhatArguments.network === "rinkeby" ||
            hardhatArguments.network === "ropsten" ||
            hardhatArguments.network === "hardhat") &&
        initial_run
    ) {
        const { log } = deployments;
        const namedAccounts = await hre.getNamedAccounts();
        const deployer = namedAccounts.deployer;
        const ethers = hre.ethers;
        const [owner] = await ethers.getSigners();
        let handlerContract;
        let orchestrator = await deployments.get("Orchestrator");
        let ctx = await deployments.get("Ctx");
        try {
            handlerContract = await deployments.get("BTCVaultHandler");
        } catch (error) {
            try {
                let tcap = await deployments.get("TCAP");
                let BTCContract = await deployments.get("WBTC");
                let divisor = process.env.DIVISOR as string;
                let ratio = process.env.RATIO as string;
                let burnFee = process.env.BURN_FEE as string;
                let liquidationPenalty = process.env
                    .LIQUIDATION_PENALTY as string;
                let tcapOracle = await deployments.get("TCAPOracle");
                let priceFeedETH = await deployments.get("WETHOracle");
                let priceFeedBTC = await deployments.get("BTCOracle");
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
                    "BTCVaultHandler",
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
                            BTCContract.address,
                            priceFeedBTC.address,
                            priceFeedETH.address,
                            rewardAddress,
                            timelock.address,
                        ],
                    }
                );
                handlerContract = await deployments.get("BTCVaultHandler");
                if (deployResult.newlyDeployed) {
                    log(
                        `BTCVaultHandler deployed at ${handlerContract.address} for ${deployResult.receipt?.gasUsed}`
                    );
                }
                const rewardDeployment = await deployments.deploy(
                    "BTCRewardHandler",
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

export default BTCVaultHandler;
