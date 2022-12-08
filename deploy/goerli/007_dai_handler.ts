import { hardhatArguments } from "hardhat";
import { deployments } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const DAIVaultHandler = async (hre: HardhatRuntimeEnvironment) => {
	if (hardhatArguments.network === "goerli") {
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
		} catch (error: any) {
			try {
				let tcap = await deployments.get("TCAP");

				let DAIContract = await deployments.get("DAI");

				let divisor =  "10000000000";
				let ratio = "200";
				let burnFee = "1";
				let liquidationPenalty = "10";

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
						0
					],
				});
				handlerContract = await deployments.get("DAIVaultHandler");
				if (deployResult.newlyDeployed) {
					log(
						`DAIVaultHandler deployed at ${handlerContract.address} for ${deployResult.receipt?.gasUsed}`
					);
				}
				const rewardDeployment = await deployments.deploy("DAIRewardHandler", {
					contract: "RewardHandler",
					from: deployer,
					args: [orchestrator.address, ctx.address, vaultAddress],
				});
				log(
					`Reward Handler deployed at ${rewardDeployment.address} for ${rewardDeployment.receipt?.gasUsed}`
				);
			} catch (error: any) {
				log(error.message);
			}
		}
	}
};
export default DAIVaultHandler;
