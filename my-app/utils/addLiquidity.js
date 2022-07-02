import { Contract, utils } from "ethers";
import {
  EXCHANGE_CONTRACT_ABI,
  EXCHANGE_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI,
  TOKEN_CONTRACT_ADDRESS,
} from "../constants";


export const addLiquidity = async (
    signer,
    addCDAmountWei,
    addEtherAmountWei
) => {
    try {
        // create a new instance of the token contract
        const tokenContract = new Contract(
            TOKEN_CONTRACT_ABI,
            TOKEN_CONTRACT_ADDRESS,
            signer
        )
        // create a new instanace of the exchange contract
        const exchangeContract = new Contract(
            EXCHANGE_CONTRACT_ABI,
            EXCHANGE_CONTRACT_ADDRESS,
            signer
        )

        let tx = await tokenContract.approve(
            EXCHANGE_CONTRACT_ADDRESS,
            addCDAmountWei.toString()
        )
        await tx.wait()
        // After the contract has the approval, add the ether and cd tokens in liquidity
        tx = await exchangeContract.addLiquidity(addCDAmountWei, {
            value: addEtherAmountWei,
        })
        await tx.wait()
    } catch (err) {
        console.error(err)
    }
}

export const calculateCD = async (
    _addEther = "0",
    etherBalanceContract,
    cdTokenReserve
    ) => {
        // _addEther is a string that we need to convert to a big number so we can do our calculation
        const _addEtherAmountWei = utils.parseEther(_addEther);

        // Ratio needs to be maintained when we add liquidty.
        // We need to let the user know for a specific amount of ether how many `CD` tokens
        // He can add so that the price impact is not large
        // The ratio we follow is (amount of Crypto Dev tokens to be added) / (Crypto Dev tokens balance) = (Eth that would be added) / (Eth reserve in the contract)
        // So by maths we get (amount of Crypto Dev tokens to be added) = (Eth that would be added * Crypto Dev tokens balance) / (Eth reserve in the contract)

    const cryptoDevTokenAmount = _addEtherAmountWei
        .mul(cdTokenReserve)
        .div(etherBalanceContract)
    return cryptoDevTokenAmount
    }