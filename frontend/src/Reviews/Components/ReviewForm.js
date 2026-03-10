import React, { useMemo, useState } from "react";

import Input from "../../Shared/Components/FormElements/Input";
import Button from "../../Shared/Components/FormElements/Button";
import ImagesUpload from "../../Shared/Components/FormElements/ImagesUpload";
import { useForm } from "../../Shared/hooks/form-hook";
import {
  VALIDATOR_MAX,
  VALIDATOR_MIN,
  VALIDATOR_MINLENGTH,
  VALIDATOR_REQUIRE,
} from "../../Shared/util/validators";
import "./ReviewForm.css";

const tagOptions = [
  "Couples",
  "Families",
  "Friends",
  "Remote Work",
  "Students",
  "Budget Friendly",
];

const formatDateForInput = (dateValue) => {
  if (!dateValue) {
    return "";
  }

  const date = new Date(dateValue);
  return date.toISOString().split("T")[0];
};

const ReviewForm = ({
  onSubmitReview,
  isLoading,
  initialReview,
  onCancelEdit,
}) => {
  const isEditMode = !!initialReview;

  const [selectedTags, setSelectedTags] = useState(
    initialReview?.recommendedFor || [],
  );
  const [existingImages, setExistingImages] = useState(
    initialReview?.images || [],
  );
  const [removedImages, setRemovedImages] = useState([]);

  const initialFormState = useMemo(
    () => ({
      rating: {
        value: initialReview ? String(initialReview.rating) : "",
        isValid: !!initialReview,
      },
      comment: {
        value: initialReview ? initialReview.comment : "",
        isValid: !!initialReview,
      },
      visitDate: {
        value: initialReview ? formatDateForInput(initialReview.visitDate) : "",
        isValid: !!initialReview,
      },
      images: {
        value: [],
        isValid: true,
      },
    }),
    [initialReview],
  );

  const [formState, inputHandler] = useForm(initialFormState, !!initialReview);

  const toggleTagHandler = (tag) => {
    setSelectedTags((prevTags) =>
      prevTags.includes(tag)
        ? prevTags.filter((item) => item !== tag)
        : [...prevTags, tag],
    );
  };

  const removeExistingImageHandler = (imagePath) => {
    setExistingImages((prevImages) =>
      prevImages.filter((image) => image !== imagePath),
    );
    setRemovedImages((prevImages) => [...prevImages, imagePath]);
  };

  const submitHandler = (event) => {
    event.preventDefault();

    onSubmitReview({
      rating: formState.inputs.rating.value,
      comment: formState.inputs.comment.value,
      visitDate: formState.inputs.visitDate.value,
      recommendedFor: selectedTags,
      images: formState.inputs.images.value || [],
      removedImages,
    });
  };

  return (
    <form className="review-form" onSubmit={submitHandler}>
      <h3>{isEditMode ? "Edit your review" : "Share your experience"}</h3>

      <Input
        id="rating"
        element="input"
        type="number"
        label="Rating (1 to 5)"
        min="1"
        max="5"
        step="1"
        validators={[VALIDATOR_REQUIRE(), VALIDATOR_MIN(1), VALIDATOR_MAX(5)]}
        errorText="Please enter a rating between 1 and 5."
        onInput={inputHandler}
        initialValue={initialFormState.rating.value}
        initialValid={initialFormState.rating.isValid}
      />

      <Input
        id="comment"
        element="textarea"
        label="What was the experience like?"
        rows="5"
        validators={[VALIDATOR_REQUIRE(), VALIDATOR_MINLENGTH(10)]}
        errorText="Please enter at least 10 characters."
        onInput={inputHandler}
        initialValue={initialFormState.comment.value}
        initialValid={initialFormState.comment.isValid}
      />

      <Input
        id="visitDate"
        element="input"
        type="date"
        label="Visit date"
        validators={[VALIDATOR_REQUIRE()]}
        errorText="Please select your visit date."
        onInput={inputHandler}
        initialValue={initialFormState.visitDate.value}
        initialValid={initialFormState.visitDate.isValid}
      />

      <div className="review-form__tags">
        <label>Recommended for</label>
        <div className="review-form__tag-list">
          {tagOptions.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`review-form__tag ${selectedTags.includes(tag) ? "review-form__tag--active" : ""}`}
              onClick={() => toggleTagHandler(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {existingImages.length > 0 && (
        <div className="review-form__existing-images">
          <label>Current review photos</label>
          <div className="review-form__existing-images-grid">
            {existingImages.map((image) => (
              <div key={image} className="review-form__existing-image-item">
                <img
                  src={`http://localhost:5000/${image}`}
                  alt="Existing review"
                />
                <button
                  type="button"
                  onClick={() => removeExistingImageHandler(image)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <ImagesUpload
        id="images"
        center
        maxFiles={4}
        required={false}
        onInput={inputHandler}
        errorText="You can upload up to 4 photos."
      />

      <div className="review-form__actions">
        <Button type="submit" disabled={!formState.isValid || isLoading}>
          {isEditMode ? "SAVE CHANGES" : "POST REVIEW"}
        </Button>

        {isEditMode && (
          <Button type="button" inverse onClick={onCancelEdit}>
            CANCEL
          </Button>
        )}
      </div>
    </form>
  );
};

export default ReviewForm;
