declare module 'pokersolver' {
  interface HandResult {
    name: string;
    rank: number;
    cards: string[];
    value: number[];
  }

  interface HandClass {
    solve(cards: string[]): HandResult;
    winners(hands: HandResult[]): HandResult[];
  }

  const pokersolver: {
    Hand: HandClass;
  };

  export default pokersolver;
}