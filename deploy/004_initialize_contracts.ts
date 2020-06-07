const ethers = require("ethers");
import {ethers as ethersBuidler, buidlerArguments} from "@nomiclabs/buidler";
import {Tcapx} from "../typechain/Tcapx";
import {TokenHandler} from "../typechain/TokenHandler";
require("dotenv").config();

module.exports = async ({deployments}: any) => {
	console.log("	buidlerArguments.network", buidlerArguments.network);
	let TcapxDeployment = await deployments.get("TCAPX");
	let tokenHandlerContractDeployment = await deployments.get("TokenHandler");
	let oracleContract = "";
	let stablecoinContract = "";
	if (buidlerArguments.network === "ganache" || buidlerArguments.network === "buidlerevm") {
		let oracle = await deployments.get("Oracle");
		oracleContract = oracle.address;
		let stablecoin = await deployments.get("DAI");
		stablecoinContract = await stablecoin.address;
	} else {
		oracleContract = process.env.ORACLE_ADDRESS as string;
		stablecoinContract = process.env.STABLECOIN_ADDRESS as string;
	}
	if (TcapxDeployment && tokenHandlerContractDeployment) {
		let TcapxContract = await ethersBuidler.getContract("TCAPX");
		let tcapxAbi = TcapxContract.interface;
		let tcapx = new ethers.Contract(
			TcapxDeployment.address,
			tcapxAbi,
			TcapxContract.signer
		) as Tcapx;
		console.log("adding token Handler", tokenHandlerContractDeployment.address);
		await tcapx.addTokenHandler(tokenHandlerContractDeployment.address);

		let handlerContract = await ethersBuidler.getContract("TokenHandler");
		let handlerAbi = handlerContract.interface;
		let handler = new ethers.Contract(
			tokenHandlerContractDeployment.address,
			handlerAbi,
			handlerContract.signer
		) as TokenHandler;

		let divisor = process.env.DIVISOR as string;
		let ratio = process.env.RATIO as string;

		console.log("setting token address", TcapxDeployment.address);
		await handler.setTCAPXContract(TcapxDeployment.address);
		console.log("setting collateral address", stablecoinContract);
		await handler.setCollateralContract(stablecoinContract);
		console.log("setting oracle address", oracleContract);
		await handler.setOracle(oracleContract);
		console.log("setting the divisor", divisor);
		await handler.setDivisor(divisor);
		console.log("setting ratio", ratio);
		await handler.setRatio(ratio);
	}
};
module.exports.tags = ["Initialize"];
