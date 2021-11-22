import { hardhatArguments } from "hardhat";
import { deployments } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const DAIVaultHandler = async (hre: HardhatRuntimeEnvironment) => {
	if (hardhatArguments.network === "optimismKovan") {
		const { log } = deployments;
		const namedAccounts = await hre.getNamedAccounts();
		const deployer = namedAccounts.deployer;
		const ethers = hre.ethers;

		let handlerContract;
		let orchestrator = await deployments.get("OptimisticOrchestrator");

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
				let priceFeedETH = await deployments.get("WETHOracle");
				let priceFeedDAI = await deployments.get("DAIOracle");
				const timelock = "0x71cEA4383F7FadDD1F17c960DE7b6A32bFDAf139"; // Testing address for now
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
						timelock,
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
export default DAIVaultHandler;
