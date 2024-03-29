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

        let divisor = 1000000000;
        let ratio = 200;
        let burnFee = 15;
        let mintFee = 15;
        let liquidationPenalty = 10;

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
            mintFee,
            liquidationPenalty,
            jpegzOracle.address,
            jpegz.address,
            WETHContract.address,
            priceFeedETH.address,
            priceFeedETH.address,
            deployer,
            "0",
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
