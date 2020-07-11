import {buidlerArguments} from "@nomiclabs/buidler";
module.exports = async ({getNamedAccounts, deployments}: any) => {
	if (buidlerArguments.network === "rinkeby") {
		const {deployIfDifferent, log} = deployments;
		const {deployer} = await getNamedAccounts();

		let handlerContract;
		try {
			handlerContract = await deployments.get("BTCVaultHandler");
		} catch (error) {
			try {
				const deployResult = await deployIfDifferent(
					["data"],
					"BTCVaultHandler",
					{from: deployer, gas: 5000000},
					"VaultHandler"
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
