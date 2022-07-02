import { BigNumber, providers, utils } from "ethers";
import Head from "next/head";
import React, {useEffect, useRef, useState} from "react";
import Web3Modal from "web3modal";
import styles from "../styles/Home.module.css";
import {addLiquidity, calculateCD } from "../utils/addLiquidity";
import {
  getCDTokensBalance,
  getEtherBalance,
  getLPTokensBalance,
  getReserveOfCDTokens
} from "../utils/getAmounts";
import {
  getTokensAfterRemove,
  removeLiquidity
} from "../utils/removeLiquidity";
import { swapTokens, getAmountOfTokensReceivedFromSwap } from "../utils/swap";

export default function Home() {
  // set up normal variables

  const [loading, setLoading] = useState(false);
  // We have two tabs in this dapp, Liquidity Tab and Swap Tab. This variable
  // keeps track of which Tab the user is on. If it is set to true this means
  // that the user is on `liquidity` tab else he is on `swap` tab
  const [liquidityTab, setLiquidityTab] = useState(true)
  // variable is the 0 number in form of a BigNumber
  const zero = BigNumber.from(0)
  // tracks teh amount of eth held my the users account
  const [ethBalance, setEtherBalance] = useState(zero);
  // keeps track of the CD tokens reserve balance in the exchange contract
  const [reservedCD, setReservedCD] = useState(zero)
  // Keeps track of the ether balance in the contract
  const [etherBalanceContract, setEtherBalanceContract] = useState(zero);
  // cdBalance is the amount of `CD` tokens help by the users account
  const [cdBalance, setCDBalance] = useState(zero);
  // the amount of LP tokens held by hte user
  const [lpBalance, setLPBalance] = useState(zero)
  // the amount of ETH the users wants to add to the liquidity pool
  const [addEther, setAddEther] = useState(zero);
  // keeps track of the amout of CD tokens teh use wants to add to the liquidity pool
  const [addCDTokens, setAddCDTokens] = useState(zero);
  // removeEther is the amount of `Ether` that would be sent back to the user based on a certain number of `LP` tokens
  const [removeEther, setRemoveEther] = useState(zero);
  // the amount of ether to be sent back based on the number of LP tokens
  const [removeCD, setRemoveCD] = useState(zero);
  // amount of LP tokens that the user wants to remove
  const [removeLPTokens, setRemoveLPTokens] =  useState("0")
  // Amount the user wants to swap
  const [swapAmount, setSwapAmount] = useState("")
  // Keeps track of the number of tokens that the user will receive after the swap
  const [tokenToBeReceivedAfterSwap, setTokenToBeReceivedAfterSwap] = useState(zero);
  // Keeps track of whethere Eth or CD tokens are selected
  const [ethSelected, setEthSelected] = useState(true)
  const web3ModalRef = useRef()

  const [walletConnected,setWalletConnected] = useState(false)


  const getAmounts = async () => {
    try {
      const provider = await getProviderOrSigner(false);
      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();
      // get the amount of eth in the user's account
      const _ethBalance = await getEtherBalance(provider, address);
      // get the amount of `Crypto Dev` tokens held by the user
      const _cdBalance = await getCDTokensBalance(provider, address);
      // get the amount of `Crypto Dev` LP tokens held by the user
      const _lpBalance = await getLPTokensBalance(provider, address);
      // gets the amount of `CD` tokens that are present in the reserve of the `Exchange contract`
      const _reservedCD = await getReserveOfCDTokens(provider);
      // Get the ether reserves in the contract
      const _ethBalanceContract = await getEtherBalance(provider, null, true);
      setEtherBalance(_ethBalance);
      setCDBalance(_cdBalance);
      setLPBalance(_lpBalance);
      setReservedCD(_reservedCD);
      setReservedCD(_reservedCD);
      setEtherBalanceContract(_ethBalanceContract);
    } catch (err) {
      console.error(err);
    }
  };


  // Swaps the ETH/CD tokens with tokenToBeReceivedAfterSwap
  const _swapTokens = async () => {
    try {
      // Convert the amount entered by the user to a BigNumber using parseEther
      const swapAmountWei = utils.parseEther(swapAmount);
      // Check if the user entered zero
      // use eq method from BigNumber class in ethers.js
      if(!swapAmountWei.eq(zero)) {
        const signer = await getProviderOrSigner(true);
        setLoading(true)
        // call the swapTokens funciton
        await swapTokens(
          signer,
          swapAmountWei,
          tokenToBeReceivedAfterSwap,
          ethSelected
        );
        setLoading(false);
        await getAmounts();
        setSwapAmount("")
      }
    } catch (err) {
      console.error(err)
      setLoading(false)
      setSwapAmount("")
    }
  };

  // Returns the number of ETH/CD tokens that can be received
  // when the user swaps _swpatAmountWei amount of ETH/CD tokens
  const _getAmountOfTokensReceivedFromSwap = async (_swapAmount) => {
    try {
      // Use BigNumber to convert the amount entered by the user
      const _swapAmountWei = utils.parseEther(_swapAmount.toString());

      if(!_swapAmountWei.eq(zero)) {
        const provider = await getProviderOrSigner();
        // get amount of eth in contract
        const _ethBalance = await getEtherBalance(provider, null, true);
        // Call the getAmountOfTokensReceivedFromSwap from the utils folder
        const amountOfTokens = await getAmountOfTokensReceivedFromSwap(
          _swapAmountWei,
          provider,
          ethSelected,
          _ethBalance,
          reservedCD
        );
        setTokenToBeReceivedAfterSwap(amountOfTokens);
      } else {
        setTokenToBeReceivedAfterSwap(zero);
      }
    } catch (err) {
      console.error(err)
    }
  }

    /**
   * _addLiquidity helps add liquidity to the exchange,
   * If the user is adding initial liquidity, user decides the ether and CD tokens he wants to add
   * to the exchange. If he is adding the liquidity after the initial liquidity has already been added
   * then we calculate the crypto dev tokens he can add, given the Eth he wants to add by keeping the ratios
   * constant
   */

    const _addLiquidity = async () => {
      try {
        const addEtherWei = utils.parseEther(addEther.toString())

        if(!addCDTokens.eq(zero) && !addEtherWei.eq(zero)) {
          const signer = await getProviderOrSigner(true);
          setLoading(true)

          // call the addLiquidity function from utils
          await addLiquidity(signer, addCDTokens, addEtherWei);
          setLoading(false)
          setAddCDTokens(zero);
          await getAmounts()
        } else {
          setAddCDTokens(zero)
        }
      } catch (err) {
        console.error(err)
        setLoading(false)
        setAddCDTokens(zero)
      }
    }

    const _removeLiquidity = async () => {
      try {
        const signer = await getProviderOrSigner(true);
        // Convert the LP tokens entered by the user to Big number
        const removeLPTokensWei = utils.parseEther(removeLPTokens);
        setLoading(true)
        // call the remove liquidity function from utils
        await removeLiquidity(signer, removeLPTokensWei);
        setLoading(false)
        await getAmounts()
        setRemoveCD(zero)
        setRemoveEther(zero)
      } catch (err) {
        console.error(err)
        setLoading(false)
        setRemoveCD(zero)
        setRemoveEther(zero)
      }
    }
      /**
   * _getTokensAfterRemove: Calculates the amount of `Ether` and `CD` tokens
   * that would be returned back to user after he removes `removeLPTokenWei` amount
   * of LP tokens from the contract
   */
    const _getTokensAfterRemove = async (_removeLPTokens) => {
      try {
        const provider = await getProviderOrSigner();
        const removeLPTokensWei = utils.parseEther(_removeLPTokens);
        const _ethBalance = await getEtherBalance(provider, null, true);
        const cryptoDevTokenReserve = await getReserveOfCDTokens(provider);
        const { _removeEther, _removeCD } = await getTokensAfterRemove(
          provider,
          removeLPTokensWei,
          _ethBalance,
          cryptoDevTokenReserve
        )
        setRemoveEther(_removeEther)
        setRemoveCD(_removeCD)
      } catch (err) {
        console.error(err)
      }
    }

    // Connect MM wallet
    const connectWallet = async () => {
      try {
        await getProviderOrSigner()
        setWalletConnected(true)
      } catch (err) {
        console.error(err)
      }
    }

    // Setting up an Ethereum RPC node
    const getProviderOrSigner = async (needSigner = false) => {
      // connect to MM 
      const provider = await web3ModalRef.current.connect()
      const web3Provider = new providers.Web3Provider(provider)

      // If user is not connected to Rinkeby network
      const { chainId } = await web3Provider.getNetwork()
      if (chainId !== 4) {
        window.alert("Change to the Rinkeby Network")
        throw new Error("Change network to rinkeby")
      }

      if (needSigner) {
        const signer = web3Provider.getSigner();
        return signer
      }
      return web3Provider
    }

    useEffect(() => {
      if (!walletConnected) {
        web3ModalRef.current = new Web3Modal({
          network: "rinkeby",
          providerOptions: {},
          disableInjectedProvider: false,
        })
        connectWallet()
        getAmounts()
      }
    }, [walletConnected])

    // Returns buttons based on the state of the dapp 
    const renderButton = () => {
      // if wallet is not connected return a button which allows them to connect to their wallet 
      if (!walletConnected) {
        return (
          <button onClick={connectWallet} className={styles.button}>
            Connect your wallet
          </button>
        )
      }
      // If we are waiting for something return loading button
      if (loading) {
        return <button className={styles.button}>Loading...</button>
      }

      if (liquidityTab) {
        return (
          <div>
            <div className={styles.description}>
              You have:
              <br />
              {utils.formatEther(cdBalance)} Crypto Dev Tokens
              <br />
              {utils.formatEther(ethBalance)} ETH
              <br />
              {utils.formatEther(lpBalance)} Crypto Dev LP Tokens
            </div>
            <div>
              {utils.parseEther(reservedCD.toString()).eq(zero) ? (
                <div>
                  <input
                    type="number"
                    placeholder="Amount of Ether"
                    onChange={(e) => setAddEther(e.target.value || "0")}
                    className={styles.input}
                  />
                  <input
                    type="number"
                    placeholder="Amount of CryptoDev Tokens"
                    onChange={(e) => 
                      setAddCDTokens(
                        BigNumber.from(utils.parseEther(e.target.value || "0"))
                      )
                    }
                    className={styles.input}
                  />
                  <button className={styles.button1} onClick={_addLiquidity}>
                    Add
                  </button>
                </div>
              ) : (
                <div>
                  <input
                  type="number"
                  placeholder="Amount of Eth"
                  onChange={async (e) => {
                    setAddEther(e.target.value || "0");
                    const _addCDTokens = await calculateCD(
                      e.target.value || "0",
                      etherBalanceContract,
                      reservedCD

                    );
                    setAddCDTokens(_addCDTokens)
                  }}
                  className={styles.input}
                  />
                  <div className={styles.inputDiv}>
                    {`You will need ${utils.formatEther(addCDTokens)} Crypo Dev Tokens`}
                  </div>
                  <button className={styles.button1} onClick={_addLiquidity}>
                    Add
                  </button>
                </div>
              )}
              <div>
                <input
                type="number"
                placeholder="Amount of LP Tokens"
                onChange={async (e) => {
                  setRemoveLPTokens(e.target.value || "0")
                  // Calculate the amount of ETH and DC tokens that the user will receive
                  await _getTokensAfterRemove(e.target.value || "0")
                }}
                className={styles.input}
                />
                <div className={styles.inputDiv}>
                  {`You will get ${utils.formatEther(removeCD)} Crypto Dev Tokens and ${utils.formatEther(removeEther)}ETH`}
                </div>
                <button className={styles.button1} onClick={_removeLiquidity}>
                  Remove
                </button>
              </div>
            </div>
          </div>
        );
      } else {
        return (
          <div>
            <input
            type="number"
            placeholder="Amount"
            onChange={async (e) => {
              setSwapAmount(e.target.value || "")
              // Calculate the amount of tokens user would reveive after the swap
              await _getAmountOfTokensReceivedFromSwap(e.target.value || "0")
            }} 
            className={styles.input}
            value={swapAmount}
            />
            <select 
              className={styles.select} 
              name="dropdown"
              id="dropdown"
              onChange={async () => {
                setEthSelected(!ethSelected)
                // Initialize the values back to zero 
                await _getAmountOfTokensReceivedFromSwap(0)
                setSwapAmount("")
              }}
              >
                <option value="eth">Ethereum</option>
                <option value="cryptoDevToken">Crypto Dev Token</option>
            </select>
            <br />
            <div className={styles.inputDiv}>
              {ethSelected 
                ? `You will get ${utils.formatEther(
                  tokenToBeReceivedAfterSwap
                )} Crypto Dev Tokens`
                      : `You will get ${utils.formatEther(
                      tokenToBeReceivedAfterSwap
                      )} ETH`}
            </div>
            <button className={styles.button1} onClick={_swapTokens}>
              Swap
            </button>
          </div>
        );
      };
}

return (
  <div>
    <Head>
      <title>Crypto Devs</title>
      <meta name="description" content="Whitelist-Dapp" />
      <link rel="icon" href="/favicon.ico" />
    </Head>
    <div className={styles.main}>
      <div>
        <h1 className={styles.title}>Welcome to Crypto Devs Exchange!</h1>
        <div className={styles.description}>
          Exchange Ethereum &#60;&#62; Crypto Dev Tokens
        </div>
        <div>
          <button
            className={styles.button}
            onClick={() => {
              setLiquidityTab(!liquidityTab);
            }}
          >
            Liquidity
          </button>
          <button
            className={styles.button}
            onClick={() => {
              setLiquidityTab(false);
            }}
          >
            Swap
          </button>
        </div>
        {renderButton()}
      </div>
      <div>
        <img className={styles.image} src="./cryptodev.svg" />
      </div>
    </div>

    <footer className={styles.footer}>
      Made with &#10084; by Donkey King
    </footer>
  </div>
);
}