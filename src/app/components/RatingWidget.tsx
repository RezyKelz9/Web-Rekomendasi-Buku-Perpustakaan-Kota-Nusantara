import { useState } from "react";
import { Star } from "lucide-react";

interface Props {
  userId: string;
  loanId: string;
  initialRating?: number | null;
  onRate: (rating: number) => void;
  size?: number;
}

export function RatingWidget({ userId, loanId, initialRating, onRate, size = 16 }: Props) {
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState<number>(initialRating ?? 0);

  const handleClick = (value: number) => {
    setSelected(value);
    onRate(value);
  };

  const display = hovered || selected;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => handleClick(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110"
          title={`${star} bintang`}
        >
          <Star
            size={size}
            className={star <= display ? "text-yellow-400 fill-yellow-400" : "text-slate-300"}
          />
        </button>
      ))}
    </div>
  );
}
