import React, { useContext, useEffect, useState } from "react";

import Card from "../../Shared/Components/UIElement/Card";
import Modal from "../../Shared/Components/UIElement/Modal";
import Avatar from "../../Shared/Components/UIElement/Avatar";
import Button from "../../Shared/Components/FormElements/Button";
import StarRating from "./StarRating";
import { AuthContext } from "../../Shared/context/auth-context";
import "./ReviewItem.css";

const ReviewItem = ({ review, onDelete, onEdit }) => {
  const auth = useContext(AuthContext);
  const images = review.images || [];

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationDirection, setAnimationDirection] = useState("next");
  const [viewerImage, setViewerImage] = useState(null);

  useEffect(() => {
    setActiveImageIndex(0);
    setIsAnimating(false);
    setViewerImage(null);
  }, [review.id, images.length]);

  const changeImageHandler = (direction) => {
    if (images.length <= 1 || isAnimating) {
      return;
    }

    setAnimationDirection(direction);
    setIsAnimating(true);

    setTimeout(() => {
      setActiveImageIndex((prevIndex) => {
        if (direction === "next") {
          return prevIndex === images.length - 1 ? 0 : prevIndex + 1;
        }

        return prevIndex === 0 ? images.length - 1 : prevIndex - 1;
      });

      setTimeout(() => {
        setIsAnimating(false);
      }, 220);
    }, 180);
  };

  const openViewerHandler = (imagePath) => {
    setViewerImage(imagePath);
  };

  const closeViewerHandler = () => {
    setViewerImage(null);
  };

  return (
    <React.Fragment>
      <Modal
        show={!!viewerImage}
        onCancel={closeViewerHandler}
        header={review.creator?.name || "Review Image"}
        className="review-item__viewer-modal"
        headerClass="review-item__viewer-header"
        contentClass="review-item__viewer-content"
        footerClass="review-item__viewer-actions"
        footer={<Button onClick={closeViewerHandler}>CLOSE</Button>}
      >
        <div className="review-item__viewer-stage">
          {viewerImage && (
            <img
              src={`http://localhost:5000/${viewerImage}`}
              alt="Review experience"
            />
          )}
        </div>
      </Modal>

      <li className="review-item">
        <Card className="review-item__content">
          <div className="review-item__header">
            <div className="review-item__author">
              <Avatar
                image={`http://localhost:5000/${review.creator.image}`}
                alt={review.creator.name}
                width="3.2rem"
              />
              <div className="review-item__author-text">
                <h3>{review.creator.name}</h3>
                <p>
                  Visited on {new Date(review.visitDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="review-item__rating">
              <StarRating value={review.rating} showValue />
            </div>
          </div>

          <p className="review-item__comment">{review.comment}</p>

          {review.recommendedFor && review.recommendedFor.length > 0 && (
            <div className="review-item__tags">
              {review.recommendedFor.map((tag) => (
                <span key={tag} className="review-item__tag">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {images.length > 0 && (
            <div className="review-item__gallery-wrapper">
              <div className="review-item__gallery">
                <button
                  type="button"
                  className="review-item__gallery-arrow review-item__gallery-arrow--left"
                  onClick={() => changeImageHandler("prev")}
                  disabled={images.length === 1 || isAnimating}
                >
                  ‹
                </button>

                <div className="review-item__gallery-stage">
                  <img
                    key={`${review.id}-${activeImageIndex}`}
                    className={`review-item__gallery-image ${
                      isAnimating
                        ? animationDirection === "next"
                          ? "review-item__gallery-image--slide-out-left"
                          : "review-item__gallery-image--slide-out-right"
                        : animationDirection === "next"
                          ? "review-item__gallery-image--slide-in-right"
                          : "review-item__gallery-image--slide-in-left"
                    }`}
                    src={`http://localhost:5000/${images[activeImageIndex]}`}
                    alt="Review experience"
                    onClick={() => openViewerHandler(images[activeImageIndex])}
                  />
                </div>

                <button
                  type="button"
                  className="review-item__gallery-arrow review-item__gallery-arrow--right"
                  onClick={() => changeImageHandler("next")}
                  disabled={images.length === 1 || isAnimating}
                >
                  ›
                </button>
              </div>

              {images.length > 1 && (
                <p className="review-item__gallery-count">
                  {activeImageIndex + 1} / {images.length}
                </p>
              )}
            </div>
          )}

          {auth.userId === review.creator.id && (
            <div className="review-item__actions">
              <Button inverse onClick={() => onEdit(review)}>
                EDIT REVIEW
              </Button>
              <Button danger onClick={() => onDelete(review.id)}>
                DELETE REVIEW
              </Button>
            </div>
          )}
        </Card>
      </li>
    </React.Fragment>
  );
};

export default ReviewItem;
