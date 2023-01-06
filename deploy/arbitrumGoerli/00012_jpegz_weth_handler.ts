import { hardhatArguments } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { deployments } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
const WETHVaultHandler = async (hre: HardhatRuntimeEnvironment) => {
  if (hardhatArguments.network === "arbitrumGoerli") {
    const { log } = deployments;
    const namedAccounts = await hre.getNamedAccounts();
    const deployer = namedAccounts.deployer;
    const ethers = hre.ethers;

    const [owner] = await ethers.getSigners();

    let handlerContract;
    let orchestrator = await deployments.get("ArbitrumOrchestrator");
    try {
      handlerContract = await deployments.get("jWETHVaultHandler");
    } catch (error: any) {
      log(error.message);
      try {
        let jpegz = await deployments.get("JPEGZ");

        let WETHContract = await deployments.get("WETH");

        let divisor = process.env.DIVISOR as string;
        let ratio = process.env.RATIO as string;
        let burnFee = process.env.BURN_FEE as string;
        let liquidationPenalty = process.env.LIQUIDATION_PENALTY as string;

        let jpegzOracle = await deployments.get("JPEGZOracle");
        let l2MessageExecutor = await deployments.get("L2MessageExecutor");
        let priceFeedETH = await deployments.get("WETHOracle");

        const deployResult = await deployments.deploy("jWETHVaultHandler", {
          from: deployer,
          contract: "ETHVaultHandler",
          args: [
            orchestrator.address,
            divisor,
            ratio,
            burnFee,
            liquidationPenalty,
            jpegzOracle.address,
            jpegz.address,
            WETHContract.address,
            priceFeedETH.address,
            priceFeedETH.address,
            l2MessageExecutor.address,
            "20000000000000000000",
          ],
        });
        handlerContract = await deployments.get("jWETHVaultHandler");
        if (deployResult.newlyDeployed) {
          log(
            `jWETHVaultHandler deployed at ${handlerContract.address} for ${deployResult.receipt?.gasUsed}`
          );
        }
      } catch (error: any) {
        log(error.message);
      }
    }
  }
};
export default WETHVaultHandler;
