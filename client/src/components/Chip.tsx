import { cn } from "@/lib/utils";

interface ChipProps {
  value: number;
  className?: string;
  count?: number;
}

const Chip = ({ value, className, count = 1 }: ChipProps) => {
  // Map chip value to background color
  const getChipColor = (value: number) => {
    switch (value) {
      case 1:
        return 'bg-white text-dark';
      case 5:
        return 'bg-green-600 text-white';
      case 10:
        return 'bg-blue-600 text-white';
      case 25:
        return 'bg-purple-600 text-white';
      case 100:
        return 'bg-accent-gold text-dark';
      default:
        return 'bg-gray-600 text-white';
    }
  };
  
  const color = getChipColor(value);
  
  return (
    <div className="relative mx-0.5">
      <div
        className={cn(
          "poker-chip w-[30px] h-[30px] rounded-full flex items-center justify-center font-bold shadow-md text-xs",
          color,
          className
        )}
      >
        {value}
      </div>
      {count > 1 && (
        <div className="absolute -top-2 -right-2 bg-dark text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {count}
        </div>
      )}
    </div>
  );
};

export default Chip;
