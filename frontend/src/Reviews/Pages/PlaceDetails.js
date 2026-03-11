import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link, useParams } from "react-router-dom";

import Card from "../../Shared/Components/UIElement/Card";
import ErrorModal from "../../Shared/Components/UIElement/ErrorModal";
import LoadingSpinner from "../../Shared/Components/UIElement/LoadingSpinner";
import Modal from "../../Shared/Components/UIElement/Modal";
import Button from "../../Shared/Components/FormElements/Button";
import ReviewForm from "../Components/ReviewForm";
import ReviewList from "../Components/ReviewList";
import StarRating from "../Components/StarRating";
import SaveToCollectionModal from "../../Collections/Components/SaveToCollectionModal";
import { useHttpClient } from "../../Shared/hooks/http-hook";
import { AuthContext } from "../../Shared/context/auth-context";
import { formatDate } from "../../Shared/util/date";
import { shareUrl } from "../../Shared/util/share";
import PlaceInsightsPanel from "../../AI/Components/PlaceInsightsPanel";
import "./PlaceDetails.css";

const getPlaceMedia = (place) => {
  if (!place) {
    return [];
  }

  if (place.media && place.media.length > 0) {
    return place.media;
  }

  if (place.image) {
    return [{ url: place.image, type: "image" }];
  }

  return [];
};

const PlaceDetails = () => {
  const auth = useContext(AuthContext);
  const { placeId } = useParams();
  const { isLoading, error, sendRequest, clearError } = useHttpClient();

  const [place, setPlace] = useState();
  const [reviews, setReviews] = useState([]);
  const [editingReview, setEditingReview] = useState(null);
  const [showSaveModal, setShowSaveModal] = useState(false);

  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const [viewerItem, setViewerItem] = useState(null);
  const [isGalleryAnimating, setIsGalleryAnimating] = useState(false);
  const [galleryAnimationDirection, setGalleryAnimationDirection] =
    useState("next");

  const [placeInsight, setPlaceInsight] = useState(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [askingAiQuestion, setAskingAiQuestion] = useState(false);

  const fetchPlaceInsight = useCallback(async () => {
    setInsightLoading(true);

    try {
      const responseData = await sendRequest(
        `http://localhost:5000/api/place-insights/place/${placeId}`,
      );
      setPlaceInsight(responseData.insight);
    } catch (err) {
    } finally {
      setInsightLoading(false);
    }
  }, [placeId, sendRequest]);
  
  const fetchPlaceDetails = useCallback(async () => {
    const placeResponse = await sendRequest(
      `http://localhost:5000/api/places/${placeId}`,
    );
    setPlace(placeResponse.place);

    const reviewsResponse = await sendRequest(
      `http://localhost:5000/api/reviews/place/${placeId}`,
    );
    setReviews(reviewsResponse.reviews);
  }, [placeId, sendRequest]);

  useEffect(() => {
    const loadPage = async () => {
      try {
        await fetchPlaceDetails();
        await fetchPlaceInsight();
      } catch (err) {}
    };

    loadPage();
  }, [fetchPlaceDetails, fetchPlaceInsight]);

  const userAlreadyReviewed = useMemo(
    () => reviews.some((review) => review.creator.id === auth.userId),
    [reviews, auth.userId],
  );

  const allPlaceMedia = useMemo(() => getPlaceMedia(place), [place]);

  const coverItem = useMemo(() => {
    const imageItem = allPlaceMedia.find((item) => item.type === "image");
    return imageItem || allPlaceMedia[0] || null;
  }, [allPlaceMedia]);

  const placeGalleryMedia = useMemo(() => {
    if (!coverItem) {
      return [];
    }

    return allPlaceMedia.filter((item) => item.url !== coverItem.url);
  }, [allPlaceMedia, coverItem]);

  useEffect(() => {
    setActiveGalleryIndex(0);
    setIsGalleryAnimating(false);
  }, [placeGalleryMedia.length, placeId]);

  const activeGalleryItem =
    placeGalleryMedia.length > 0 ? placeGalleryMedia[activeGalleryIndex] : null;

  const openViewerHandler = (item) => {
    if (!item || item.type !== "image") {
      return;
    }

    setViewerItem(item);
  };

  const closeViewerHandler = () => {
    setViewerItem(null);
  };

  const changeGalleryItemHandler = (direction) => {
    if (placeGalleryMedia.length <= 1 || isGalleryAnimating) {
      return;
    }

    setGalleryAnimationDirection(direction);
    setIsGalleryAnimating(true);

    setTimeout(() => {
      setActiveGalleryIndex((prevIndex) => {
        if (direction === "next") {
          return prevIndex === placeGalleryMedia.length - 1 ? 0 : prevIndex + 1;
        }

        return prevIndex === 0 ? placeGalleryMedia.length - 1 : prevIndex - 1;
      });

      setTimeout(() => {
        setIsGalleryAnimating(false);
      }, 220);
    }, 180);
  };

  const previousGalleryItemHandler = () => {
    changeGalleryItemHandler("prev");
  };

  const nextGalleryItemHandler = () => {
    changeGalleryItemHandler("next");
  };

  const createReviewHandler = async (reviewData) => {
    const formData = new FormData();
    formData.append("rating", reviewData.rating);
    formData.append("comment", reviewData.comment);
    formData.append("visitDate", reviewData.visitDate);
    formData.append(
      "recommendedFor",
      JSON.stringify(reviewData.recommendedFor),
    );
    reviewData.images.forEach((image) => formData.append("images", image));

    try {
      await sendRequest(
        `http://localhost:5000/api/reviews/place/${placeId}`,
        "POST",
        formData,
        {
          authorization: `Cameleon ${auth.token}`,
        },
      );
      await fetchPlaceDetails();
      await fetchPlaceInsight();
    } catch (err) {}
  };

  const updateReviewHandler = async (reviewData) => {
    if (!editingReview) {
      return;
    }

    const formData = new FormData();
    formData.append("rating", reviewData.rating);
    formData.append("comment", reviewData.comment);
    formData.append("visitDate", reviewData.visitDate);
    formData.append(
      "recommendedFor",
      JSON.stringify(reviewData.recommendedFor),
    );
    formData.append(
      "removedImages",
      JSON.stringify(reviewData.removedImages || []),
    );

    reviewData.images.forEach((image) => formData.append("images", image));

    try {
      await sendRequest(
        `http://localhost:5000/api/reviews/${editingReview.id}`,
        "PATCH",
        formData,
        {
          authorization: `Cameleon ${auth.token}`,
        },
      );
      setEditingReview(null);
      await fetchPlaceDetails();
      await fetchPlaceInsight();
    } catch (err) {}
  };

  const deleteReviewHandler = async (reviewId) => {
    try {
      await sendRequest(
        `http://localhost:5000/api/reviews/${reviewId}`,
        "DELETE",
        null,
        {
          authorization: `Cameleon ${auth.token}`,
        },
      );

      if (editingReview && editingReview.id === reviewId) {
        setEditingReview(null);
      }

      await fetchPlaceDetails();
      await fetchPlaceInsight();
    } catch (err) {}
  };

  const askPlaceQuestionHandler = async (question) => {
    setAskingAiQuestion(true);

    try {
      const responseData = await sendRequest(
        `http://localhost:5000/api/place-insights/place/${placeId}/ask`,
        "POST",
        JSON.stringify({ question }),
        {
          "Content-Type": "application/json",
        },
      );

      return responseData.answer;
    } catch (err) {
      return null;
    } finally {
      setAskingAiQuestion(false);
    }
  };

  const sharePlaceHandler = async () => {
    if (!place) {
      return;
    }

    try {
      await shareUrl({
        title: place.title,
        text: place.description,
        url: `${window.location.origin}/places/${placeId}/details`,
      });
    } catch (err) {}
  };

  if (isLoading && !place) {
    return (
      <div className="center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!place && !error) {
    return (
      <div className="center">
        <Card>
          <h2>Could not find place details.</h2>
        </Card>
      </div>
    );
  }

  return (
    <React.Fragment>
      <ErrorModal error={error} onClear={clearError} />

      {auth.isLoggedIn && place && (
        <SaveToCollectionModal
          show={showSaveModal}
          onCancel={() => setShowSaveModal(false)}
          placeId={placeId}
          placeTitle={place.title}
        />
      )}

      <Modal
        show={!!viewerItem}
        onCancel={closeViewerHandler}
        header={place?.title || "Image Viewer"}
        className="place-details__viewer-modal"
        headerClass="place-details__viewer-header"
        contentClass="place-details__viewer-content"
        footerClass="place-details__viewer-actions"
        footer={<Button onClick={closeViewerHandler}>CLOSE</Button>}
      >
        <div className="place-details__viewer-stage">
          {viewerItem && (
            <img
              src={`http://localhost:5000/${viewerItem.url}`}
              alt={place?.title || "Place media"}
            />
          )}
        </div>
      </Modal>

      {place && (
        <div className="place-details">
          <Card className="place-details__hero">
            {coverItem && (
              <div className="place-details__image">
                {coverItem.type === "video" ? (
                  <video
                    controls
                    src={`http://localhost:5000/${coverItem.url}`}
                  />
                ) : (
                  <img
                    src={`http://localhost:5000/${coverItem.url}`}
                    alt={place.title}
                    onClick={() => openViewerHandler(coverItem)}
                  />
                )}
              </div>
            )}

            <div className="place-details__summary">
              <h1>{place.title}</h1>
              <p className="place-details__address">{place.address}</p>

              {place.addressNotes && (
                <p className="place-details__address-notes">
                  <strong>Address notes:</strong> {place.addressNotes}
                </p>
              )}

              <div className="place-details__meta-chips">
                {place.category && (
                  <span className="place-details__chip">{place.category}</span>
                )}
                {place.priceLevel && (
                  <span className="place-details__chip">
                    {place.priceLevel}
                  </span>
                )}
                {(place.tags || []).map((tag) => (
                  <span key={tag} className="place-details__chip">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="place-details__rating-row">
                <StarRating value={place.averageRating || 0} showValue />
                <span>
                  {place.reviewCount || 0}{" "}
                  {(place.reviewCount || 0) === 1 ? "review" : "reviews"}
                  {(place.reviewImagesCount || 0) > 0
                    ? ` · ${place.reviewImagesCount} review photos`
                    : ""}
                </span>
              </div>

              {place.creator && place.creator.name && (
                <p className="place-details__creator">
                  Added by{" "}
                  <Link to={`/${place.creator.id}/places`}>
                    {place.creator.name}
                  </Link>
                </p>
              )}

              <p className="place-details__dates">
                Created: {formatDate(place.createdAt)} · Updated:{" "}
                {formatDate(place.updatedAt)}
              </p>

              <div className="place-details__summary-actions">
                {auth.isLoggedIn && (
                  <Button inverse onClick={() => setShowSaveModal(true)}>
                    SAVE
                  </Button>
                )}
                <Button inverse onClick={sharePlaceHandler}>
                  SHARE
                </Button>
              </div>

              <p className="place-details__description">{place.description}</p>
            </div>
          </Card>

          {placeGalleryMedia.length > 0 && (
            <Card className="place-details__gallery-card">
              <h2>Place gallery</h2>

              <div className="place-details__gallery-slider">
                <button
                  type="button"
                  className="place-details__gallery-arrow place-details__gallery-arrow--left"
                  onClick={previousGalleryItemHandler}
                  disabled={
                    placeGalleryMedia.length === 1 || isGalleryAnimating
                  }
                >
                  ‹
                </button>

                <div className="place-details__gallery-stage">
                  {activeGalleryItem?.type === "video" ? (
                    <video
                      key={`${place.id || place.title}-video-${activeGalleryIndex}`}
                      className={`place-details__gallery-media ${
                        isGalleryAnimating
                          ? galleryAnimationDirection === "next"
                            ? "place-details__gallery-media--slide-out-left"
                            : "place-details__gallery-media--slide-out-right"
                          : galleryAnimationDirection === "next"
                            ? "place-details__gallery-media--slide-in-right"
                            : "place-details__gallery-media--slide-in-left"
                      }`}
                      controls
                      src={`http://localhost:5000/${activeGalleryItem.url}`}
                    />
                  ) : (
                    <img
                      key={`${place.id || place.title}-image-${activeGalleryIndex}`}
                      className={`place-details__gallery-media ${
                        isGalleryAnimating
                          ? galleryAnimationDirection === "next"
                            ? "place-details__gallery-media--slide-out-left"
                            : "place-details__gallery-media--slide-out-right"
                          : galleryAnimationDirection === "next"
                            ? "place-details__gallery-media--slide-in-right"
                            : "place-details__gallery-media--slide-in-left"
                      }`}
                      src={`http://localhost:5000/${activeGalleryItem?.url}`}
                      alt={`${place.title} gallery item`}
                      onClick={() => openViewerHandler(activeGalleryItem)}
                    />
                  )}
                </div>

                <button
                  type="button"
                  className="place-details__gallery-arrow place-details__gallery-arrow--right"
                  onClick={nextGalleryItemHandler}
                  disabled={
                    placeGalleryMedia.length === 1 || isGalleryAnimating
                  }
                >
                  ›
                </button>
              </div>

              {placeGalleryMedia.length > 1 && (
                <p className="place-details__gallery-count">
                  {activeGalleryIndex + 1} / {placeGalleryMedia.length}
                </p>
              )}
            </Card>
          )}

          <div className="place-details__ai-section">
            <PlaceInsightsPanel
              insight={placeInsight}
              isLoading={insightLoading}
              asking={askingAiQuestion}
              onAskQuestion={askPlaceQuestionHandler}
            />
          </div>

          {auth.isLoggedIn && editingReview && (
            <ReviewForm
              onSubmitReview={updateReviewHandler}
              isLoading={isLoading}
              initialReview={editingReview}
              onCancelEdit={() => setEditingReview(null)}
            />
          )}

          {auth.isLoggedIn && !editingReview && !userAlreadyReviewed && (
            <ReviewForm
              onSubmitReview={createReviewHandler}
              isLoading={isLoading}
            />
          )}

          <section className="place-details__reviews-section">
            <h2>Community reviews</h2>
            <ReviewList
              reviews={reviews}
              onDeleteReview={deleteReviewHandler}
              onEditReview={setEditingReview}
            />
          </section>
        </div>
      )}
    </React.Fragment>
  );
};

export default PlaceDetails;
