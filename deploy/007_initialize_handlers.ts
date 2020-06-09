import {ethers} from "ethers";
import {ethers as ethersBuidler, buidlerArguments} from "@nomiclabs/buidler";
import {Stablecoin} from "../typechain/Stablecoin";
import {Tcapx} from "../typechain/Tcapx";
import {DaiTokenHandler} from "../typechain/DaiTokenHandler";
import {UsdcTokenHandler} from "../typechain/UsdcTokenHandler";
import {UsdtTokenHandler} from "../typechain/UsdtTokenHandler";
require("dotenv").config();
module.exports = async ({getNamedAccounts, deployments}: any) => {
	if (buidlerArguments.network === "ganache" || buidlerArguments.network === "buidlerevm") {
		const {deployIfDifferent, log} = deployments;
		const {deployer} = await getNamedAccounts();

		let DAIHandler = await deployments.get("DAITokenHandler");
		let USDCHandler = await deployments.get("USDCTokenHandler");
		let USDTHandler = await deployments.get("USDTTokenHandler");
		let tcapx = await deployments.get("TCAPX");

		let divisor = process.env.DIVISOR as string;
		let ratio = process.env.RATIO as string;
		let oracle = await deployments.get("Oracle");

		let daiHandlerContract = await ethersBuidler.getContract("DAITokenHandler");
		let usdcHandlerContract = await ethersBuidler.getContract("USDCTokenHandler");
		let usdtHandlerContract = await ethersBuidler.getContract("USDTTokenHandler");

		let DAIContract = await deployments.get("DAI");
		let USDCContract = await deployments.get("USDC");
		let USDTContract = await deployments.get("USDT");

		let dai = new ethers.Contract(
			DAIHandler.address,
			daiHandlerContract.interface,
			daiHandlerContract.signer
		) as DaiTokenHandler;

		let usdc = new ethers.Contract(
			USDCHandler.address,
			usdcHandlerContract.interface,
			usdcHandlerContract.signer
		) as UsdcTokenHandler;

		let usdt = new ethers.Contract(
			USDTHandler.address,
			usdtHandlerContract.interface,
			usdtHandlerContract.signer
		) as UsdtTokenHandler;

		console.log("setting token address", tcapx.address);
		await dai.setTCAPXContract(tcapx.address);
		await usdc.setTCAPXContract(tcapx.address);
		await usdt.setTCAPXContract(tcapx.address);

		console.log("setting collateral address");
		await dai.setCollateralContract(DAIContract.address);
		await usdc.setCollateralContract(USDCContract.address);
		await usdt.setCollateralContract(USDTContract.address);

		console.log("setting the divisor", divisor);
		await dai.setDivisor(divisor);
		await usdc.setDivisor(divisor);
		await usdt.setDivisor(divisor);

		console.log("setting ratio", ratio);
		await dai.setRatio(ratio);
		await usdc.setRatio(ratio);
		await usdt.setRatio(ratio);

		console.log("setting oracle", oracle.address);
		await dai.setOracle(oracle.address);
		await usdc.setOracle(oracle.address);
		await usdt.setOracle(oracle.address);
	}
};
module.exports.tags = ["Initialize"];
