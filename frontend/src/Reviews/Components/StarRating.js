import React from "react";
import "./StarRating.css";

const StarRating = ({ value = 0, size = "default", showValue = false }) => {
  const roundedValue = Math.round(value);

  return (
    <div className={`star-rating star-rating--${size}`}>
      <span className="star-rating__stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={
              star <= roundedValue
                ? "star-rating__star star-rating__star--filled"
                : "star-rating__star"
            }
          >
            ★
          </span>
        ))}
      </span>
      {showValue && (
        <span className="star-rating__value">{value.toFixed(1)}</span>
      )}
    </div>
  );
};

export default StarRating;
