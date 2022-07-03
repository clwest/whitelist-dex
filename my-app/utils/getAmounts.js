import { Contract } from "ethers";
import {
    EXCHANGE_CONTRACT_ADDRESS,
    EXCHANGE_CONTRACT_ABI,
    TOKEN_CONTRACT_ADDRESS,
    TOKEN_CONTRACT_ABI,
    

} from "../constants";

// Retrieves teh balance of user or contract

export const getEtherBalance = async (provider, address, contract = false) => {
    try {
        // caller has set the contract bool to true
        if (contract) {
            const balance = await provider.getBalance(EXCHANGE_CONTRACT_ADDRESS);
            
            return balance;
        } else {
            const balance = await provider.getBalance(address);
            return balance;
        }
    } catch (err) {
        console.error(err)
        return 0;
    }
}

export const getCDTokensBalance = async (provider, address) => {
    try {
        const tokenContract = new Contract(
            TOKEN_CONTRACT_ADDRESS,
            TOKEN_CONTRACT_ABI,
            provider
        );
        const balanceOfCryptoDevTokens = await tokenContract.balanceOf(address)
        return balanceOfCryptoDevTokens
    } catch (err) {
        console.error(err)
    }
}

export const getLPTokensBalance = async (provider, address) => {
    try {
        const exchangeContract = new Contract(
            EXCHANGE_CONTRACT_ADDRESS,
            EXCHANGE_CONTRACT_ABI,
            provider
        );
        const balanceOfLPTokens = await exchangeContract.balanceOf(address);
        return balanceOfLPTokens
    } catch (err) {
        console.error(err)
    }
}

export const getReserveOfCDTokens = async (provider) => {
    try {
        const exchangeContract = new Contract(
            EXCHANGE_CONTRACT_ADDRESS,
            EXCHANGE_CONTRACT_ABI,
            provider
        );

        const reserve = await exchangeContract.getReserve();
        return reserve
    } catch (err) {
        console.error(err)
    }
}