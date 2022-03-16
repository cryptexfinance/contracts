import hre from "hardhat";
import { Signer } from "ethers";

export async function deployContract(name: string, deployer: Signer, args: any[]) {
	const contractCls = await hre.ethers.getContractFactory(name);
	return await contractCls.connect(deployer).deploy(...args);
}
