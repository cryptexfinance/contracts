import { hardhatArguments } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { deployments } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";

module.exports = async (hre: HardhatRuntimeEnvironment) => {
	if (hardhatArguments.network === "mumbai") {
		const { log } = deployments;
		const namedAccounts = await hre.getNamedAccounts();
		const deployer = namedAccounts.deployer;
		const ethers = hre.ethers;

		const [owner] = await ethers.getSigners();

		let handlerContract;
		let orchestrator = await deployments.get("PolygonOrchestrator");
		try {
			handlerContract = await deployments.get("MATICVaultHandler");
		} catch (error) {
			log(error.message);
			try {
				let tcap = await deployments.get("TCAP");

				let WETHContract = await deployments.get("WMATIC");

				let divisor = process.env.DIVISOR as string;
				let ratio = process.env.RATIO as string;
				let burnFee = process.env.BURN_FEE as string;
				let liquidationPenalty = process.env.LIQUIDATION_PENALTY as string;
				let tcapOracle = await deployments.get("TCAPOracle");
				let priceFeedETH = await deployments.get("WMATICOracle");
				const polygonTreasuryDeployResult = await deployments.get("PolygonTreasury");
				let rewardAddress = ethers.constants.AddressZero;

				const deployResult = await deployments.deploy("MATICVaultHandler", {
					from: deployer,
					args: [
						orchestrator.address,
						divisor,
						ratio,
						burnFee,
						liquidationPenalty,
						tcapOracle.address,
						tcap.address,
						WETHContract.address,
						priceFeedETH.address,
						priceFeedETH.address,
						rewardAddress,
						polygonTreasuryDeployResult.address,
					],
				});
				handlerContract = await deployments.get("MATICVaultHandler");
				if (deployResult.newlyDeployed) {
					log(
						`MATICVaultHandler deployed at ${handlerContract.address} for ${deployResult.receipt?.gasUsed}`
					);
				}
			} catch (error) {
				log(error.message);
			}
		}
	}
};
module.exports.tags = ['WMATICVaultHandler'];
