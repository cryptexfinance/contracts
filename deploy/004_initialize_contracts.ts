const ethers = require("ethers");
import {utils} from "ethers";
import {ethers as ethersBuidler, buidlerArguments} from "@nomiclabs/buidler";
import {Tcapx} from "../typechain/Tcapx";
import {TokenHandler} from "../typechain/TokenHandler";
require("dotenv").config();
//TODO: complete
module.exports = async ({deployments}: any) => {
	console.log("	buidlerArguments.network", buidlerArguments.network);
	let TcapxDeployment = await deployments.get("TCAPX");
	let tokenHandlerContractDeployment = await deployments.get("TokenHandler");

	if (TcapxDeployment && tokenHandlerContractDeployment) {
		let TcapxContract = await ethersBuidler.getContract("TCAPX");
		let tcapxAbi = TcapxContract.interface;
		let meta = new ethers.Contract(
			TcapxDeployment.address,
			tcapxAbi,
			TcapxContract.signer
		) as Tcapx;
		console.log("setting token Handler", tokenHandlerContractDeployment.address);
		await meta.setHandlerAddress(tokenHandlerContractDeployment.address);

		let handlerContract = await ethersBuidler.getContract("TokenHandler");
		let subsAbi = handlerContract.interface;
		let subs = new ethers.Contract(
			tokenHandlerContractDeployment.address,
			subsAbi,
			handlerContract.signer
		) as TokenHandler;

		let stakingPrice = utils.parseEther(process.env.STAKING_PRICE as string);
		let minBurn = process.env.MIN_BURN as string;
		console.log("setting token address", TcapxDeployment.address);
		await subs.setTokenAddress(TcapxDeployment.address);
		console.log("setting staking address", process.env.DAI_TOKEN);
		await subs.setStakingTokenAddress(process.env.DAI_TOKEN as string);
		console.log("setting setInterestTokenAddress", process.env.RDAI_TOKEN);
		await subs.setInterestTokenAddress(process.env.RDAI_TOKEN as string);
		console.log("setting setStakingPrice", stakingPrice);
		await subs.setStakingPrice(stakingPrice);
		console.log("setting setMinBurn", minBurn);
		await subs.setMinBurn(minBurn);
	}
};
module.exports.tags = ["Initialize"];
