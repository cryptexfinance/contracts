import hre, { deployments, hardhatArguments } from "hardhat";

module.exports = async ({ getNamedAccounts, deployments }: any) => {
	if (hardhatArguments.network !== "arbitrum")
		return;

	const { deployIfDifferent, log } = deployments;
	const { deployer } = await getNamedAccounts();

	const arbitrumCCIPChainSelector = 4949039107694359620;
	const baseCCIPChainSelector = 15971525489660198786;

	const arbitrumReceiver = null; // fill this address with GovernanceCCIPReceiver deployed on arbitrum
	const baseReceiver = null; // fill this address with GovernanceCCIPReceiver deployed on base

	if (arbitrumReceiver === null || baseReceiver === null ) {
		console.log("set arbitrumReceiver and baseReceiver");
		return;
	}

	const arbitrumCCIProuter = "0x141fa059441E0ca23ce184B6A78bafD2A517DdE8";
  const mainnetGovernanceCCIPRelay = null; // precompute mainnet GovernanceCCIPRelay using: https://github.com/cryptexfinance/contracts/blob/3e2266c02177b77694ea33f7267a8ebeeeb9282e/test/ccip/GovernanceCCIPIntegrationTest.t.sol#L91-L94
  const owner = null; // set an address that can pause ArbitrumGovernanceCCIPReceiver

  if(mainnetSender === null) {
		console.log("set mainnetGovernanceCCIPRelay");
		return;
  }

  if(owner === null) {
		console.log("set owner");
		return;
  }

	const governanceCCIPReceiver = await deployments.deploy("ArbitrumGovernanceCCIPReceiver", {
		contract: "GovernanceCCIPReceiver",
		from: deployer,
		skipIfAlreadyDeployed: true,
		log: true,
		args: [
			arbitrumCCIProuter,
			mainnetGovernanceCCIPRelay,
			owner
		],
	});
	console.log(
		`ArbitrumGovernanceCCIPReceiver deployed at ${governanceCCIPReceiver.address} for
		${governanceCCIPReceiver.receipt?.gasUsed}`
	);

}

module.exports.tags = ["ArbitrumGovernanceCCIPReceiver"]
