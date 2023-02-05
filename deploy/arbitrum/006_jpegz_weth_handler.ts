import { hardhatArguments } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { deployments } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
const WETHVaultHandler = async (hre: HardhatRuntimeEnvironment) => {
  if (hardhatArguments.network === "arbitrum") {
    const { log } = deployments;
    const namedAccounts = await hre.getNamedAccounts();
    const deployer = namedAccounts.deployer;
    const ethers = hre.ethers;

    const [owner] = await ethers.getSigners();

    let handlerContract;
    let orchestrator = await deployments.get("ArbitrumOrchestrator");
    try {
      handlerContract = await deployments.get("jpgzWETHVaultHandler");
    } catch (error: any) {
      log(error.message);
      try {
        //params
        let jpegz = await deployments.get("JPEGZ");
        let WETHContract = "0x82af49447d8a07e3bd95bd0d56f35241523fbab1";
        let divisor = 1000000000;
        let ratio = 150;
        let burnFee = 150;
        let mintFee = 150;
        let liquidationPenalty = 20;
        let treasury = await deployments.get("ArbitrumTreasury");
        let cap = 0;

        let jpegzOracle = await deployments.get("JPEGZOracle");
        let priceFeedETH = await deployments.get("WETHOracle");

        const deployResult = await deployments.deploy("jpgzWETHVaultHandler", {
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
            WETHContract,
            priceFeedETH.address,
            priceFeedETH.address,
            treasury.address,
            cap,
          ],
        });
        handlerContract = await deployments.get("jpgzWETHVaultHandler");
        if (deployResult.newlyDeployed) {
          log(
            `jpgzWETHVaultHandler deployed at ${handlerContract.address} for ${deployResult.receipt?.gasUsed}`
          );
        }
      } catch (error: any) {
        log(error.message);
      }
    }
  }
};
export default WETHVaultHandler;
