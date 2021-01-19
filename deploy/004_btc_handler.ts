import { hardhatArguments } from "hardhat";

module.exports = async ({ getNamedAccounts, deployments }: any) => {
	if (
		hardhatArguments.network === "rinkeby" ||
		hardhatArguments.network === "ropsten" ||
		hardhatArguments.network === "ganache"
	) {
		const { deployIfDifferent, log } = deployments;
		const { deployer } = await getNamedAccounts();

		let handlerContract;
		let orchestrator = await deployments.get("Orchestrator");
		try {
			handlerContract = await deployments.get("BTCVaultHandler");
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

				const deployResult = await deployIfDifferent(
					["data"],
					"BTCVaultHandler",
					{ from: deployer, gas: 8000000 },
					"ERC20VaultHandler",
					orchestrator.address,
					divisor,
					ratio,
					burnFee,
					liquidationPenalty,
					tcapOracle.address,
					tcap.address,
					DAIContract.address,
					priceFeedDAI.address,
					priceFeedETH.address
				);
				handlerContract = await deployments.get("BTCVaultHandler");
				if (deployResult.newlyDeployed) {
					log(
						`BTCVaultHandler deployed at ${handlerContract.address} for ${deployResult.receipt.gasUsed}`
					);
				}
			} catch (error) {
				log(error.message);
			}
		}
	}
};
module.exports.tags = ["BTCVaultHandler"];
