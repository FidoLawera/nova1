import { useState } from "react";
import { ConnectWallet, useAddress } from "@thirdweb-dev/react";
import { Link } from "wouter";
import { GiPokerHand } from "react-icons/gi";

const Header = () => {
  const address = useAddress();
  
  return (
    <header className="bg-slate-800 py-3 px-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/">
          <div className="flex items-center cursor-pointer">
            <GiPokerHand className="text-amber-500 text-2xl mr-2" />
            <h1 className="text-xl font-bold text-white">Poker 1v1</h1>
          </div>
        </Link>
        
        {/* ThirdWeb Wallet Connection */}
        <div className="wallet-connection">
          <ConnectWallet 
            theme="dark"
            btnTitle="Connect Wallet"
            modalTitle="Login"
            auth={{
              loginOptional: false,
            }}
            modalSize="wide"
            modalTitleIconUrl=""
            className="!bg-amber-500 !text-slate-900 font-medium !py-2 !px-4 !rounded-lg flex items-center hover:!bg-amber-400 transition-all"
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
