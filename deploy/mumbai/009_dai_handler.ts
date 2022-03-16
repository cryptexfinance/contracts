import { hardhatArguments } from "hardhat";
import { deployments } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";

module.exports = async (hre: HardhatRuntimeEnvironment) => {
	if (hardhatArguments.network === "mumbai") {
		const { log } = deployments;
		const namedAccounts = await hre.getNamedAccounts();
		const deployer = namedAccounts.deployer;
		const ethers = hre.ethers;

		let handlerContract;
		let orchestrator = await deployments.get("PolygonOrchestrator");

		try {
			handlerContract = await deployments.get("DAIVaultHandler");
		} catch (error) {
			try {
				let tcap = await deployments.get("TCAP");

				let DAIContract = await deployments.get("DAI");

				let divisor = process.env.DIVISOR as string;
				let ratio = process.env.RATIO as string;
				let burnFee = process.env.BURN_FEE as string;
				let liquidationPenalty = process.env.LIQUIDATION_PENALTY as string;
				let tcapOracle = await deployments.get("TCAPOracle");
				let priceFeedETH = await deployments.get("WMATICOracle");
				let priceFeedDAI = await deployments.get("DAIOracle");
				const polygonTreasuryDeployResult = await deployments.get("PolygonTreasury");
				let rewardAddress = ethers.constants.AddressZero;

				const deployResult = await deployments.deploy("DAIVaultHandler", {
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
						polygonTreasuryDeployResult.address,
					],
				});
				handlerContract = await deployments.get("DAIVaultHandler");
				if (deployResult.newlyDeployed) {
					log(
						`DAIVaultHandler deployed at ${handlerContract.address} for ${deployResult.receipt?.gasUsed}`
					);
				}
			} catch (error) {
				log(error.message);
			}
		}
	}
};
module.exports.tags = ['DAIVaultHandler'];
