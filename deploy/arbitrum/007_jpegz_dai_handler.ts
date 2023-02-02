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
      handlerContract = await deployments.get("jpgzDAIVaultHandler");
    } catch (error: any) {
      log(error.message);
      try {
        //params
        let jpegz = await deployments.get("JPEGZ");
        let DAIContract = "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1" ;
        let divisor = 1000000000;
        let ratio = 170;
        let burnFee = 150;
        let mintFee = 150;
        let liquidationPenalty = 20;
        let treasury = await deployments.get("ArbitrumTreasury");
        let cap = 0;

        let jpegzOracle = await deployments.get("JPEGZOracle");
        let priceFeedETH = await deployments.get("WETHOracle");
        let daiOracle = await deployments.get("DAIOracle");

        const deployResult = await deployments.deploy("jpgzDAIVaultHandler", {
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
            DAIContract,
            daiOracle.address,
            priceFeedETH.address,
            treasury.address,
            cap,
          ],
        });
        handlerContract = await deployments.get("jpgzDAIVaultHandler");
        if (deployResult.newlyDeployed) {
          log(
            `jpgzDAIVaultHandler deployed at ${handlerContract.address} for ${deployResult.receipt?.gasUsed}`
          );
        }
      } catch (error: any) {
        log(error.message);
      }
    }
  }
};
export default WETHVaultHandler;
