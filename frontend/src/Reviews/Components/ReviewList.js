import React from "react";

import Card from "../../Shared/Components/UIElement/Card";
import ReviewItem from "./ReviewItem";
import "./ReviewList.css";

const ReviewList = ({ reviews, onDeleteReview, onEditReview }) => {
  if (!reviews.length) {
    return (
      <Card className="review-list__empty">
        <h3>No reviews yet</h3>
        <p>
          Be the first person to share a detailed experience for this place.
        </p>
      </Card>
    );
  }

  return (
    <ul className="review-list">
      {reviews.map((review) => (
        <ReviewItem
          key={review.id}
          review={review}
          onDelete={onDeleteReview}
          onEdit={onEditReview}
        />
      ))}
    </ul>
  );
};

export default ReviewList;
