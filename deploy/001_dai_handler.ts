import {buidlerArguments} from "@nomiclabs/buidler";
module.exports = async ({getNamedAccounts, deployments}: any) => {
	if (buidlerArguments.network === "rinkeby" || buidlerArguments.network === "ganache") {
		const {deployIfDifferent, log} = deployments;
		const {deployer} = await getNamedAccounts();

		let handlerContract;
		try {
			handlerContract = await deployments.get("DAIVaultHandler");
		} catch (error) {
			try {
				const deployResult = await deployIfDifferent(
					["data"],
					"DAIVaultHandler",
					{from: deployer, gas: 8000000},
					"VaultHandler"
				);
				handlerContract = await deployments.get("DAIVaultHandler");
				if (deployResult.newlyDeployed) {
					log(
						`DAIVaultHandler deployed at ${handlerContract.address} for ${deployResult.receipt.gasUsed}`
					);
				}
			} catch (error) {
				log(error.message);
			}
		}
	}
};
module.exports.tags = ["DAIVaultHandler"];
