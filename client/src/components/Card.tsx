import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { SUIT_SYMBOLS } from "@shared/constants";
import type { CardType } from "@shared/types";

interface CardProps {
  card?: CardType;
  isHidden?: boolean;
  isDealt?: boolean;
  isRevealed?: boolean;
  className?: string;
  delay?: number;
}

const Card = ({ 
  card, 
  isHidden = false, 
  isDealt = false, 
  isRevealed = false,
  className = "", 
  delay = 0 
}: CardProps) => {
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [shouldReveal, setShouldReveal] = useState(false);
  
  useEffect(() => {
    if (isDealt) {
      const timer = setTimeout(() => {
        setShouldAnimate(true);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [isDealt, delay]);
  
  useEffect(() => {
    if (isRevealed) {
      const timer = setTimeout(() => {
        setShouldReveal(true);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [isRevealed, delay]);
  
  const getCardValue = (value?: string) => {
    if (!value) return "";
    return value;
  };
  
  const getCardSymbol = (suit?: string) => {
    if (!suit) return "";
    return SUIT_SYMBOLS[suit as keyof typeof SUIT_SYMBOLS] || "";
  };
  
  const isRed = card?.suit === "hearts" || card?.suit === "diamonds";
  
  return (
    <div
      className={cn(
        "poker-card w-[70px] h-[100px] bg-white rounded-md shadow-md relative m-0 -mx-2.5 border border-gray-200",
        isHidden && "back bg-ui-blue bg-opacity-80 text-transparent",
        shouldAnimate && "animate-deal",
        shouldReveal && "animate-flip",
        isRed && "text-red-600",
        className
      )}
    >
      {!isHidden && card && (
        <>
          <div className="value absolute top-1.5 left-1.5 font-bold text-sm">
            {getCardValue(card.value)}
          </div>
          <div className="suit text-2xl">
            {getCardSymbol(card.suit)}
          </div>
        </>
      )}
    </div>
  );
};

export default Card;
