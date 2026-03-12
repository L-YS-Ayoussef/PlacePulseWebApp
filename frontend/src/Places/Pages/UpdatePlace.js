import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate, useParams } from "react-router-dom";

import Input from "../../Shared/Components/FormElements/Input";
import Button from "../../Shared/Components/FormElements/Button";
import ErrorModal from "../../Shared/Components/UIElement/ErrorModal";
import LoadingSpinner from "../../Shared/Components/UIElement/LoadingSpinner";
import Card from "../../Shared/Components/UIElement/Card";
import MediaUpload from "../../Shared/Components/FormElements/MediaUpload";
import MultiSelectDropdown from "../../Shared/Components/FormElements/MultiSelectDropdown";

import {
  VALIDATOR_MINLENGTH,
  VALIDATOR_REQUIRE,
} from "../../Shared/util/validators";
import { useHttpClient } from "../../Shared/hooks/http-hook";
import { useForm } from "../../Shared/hooks/form-hook";
import { AuthContext } from "../../Shared/context/auth-context";
import {
  categoryOptions,
  priceLevelOptions,
  tagOptions,
} from "../place-options";

import "./NewPlace.css";

const getPlaceMedia = (place) => {
  if (place.media && place.media.length > 0) {
    return place.media;
  }

  if (place.image) {
    return [{ url: place.image, type: "image" }];
  }

  return [];
};

const UpdatePlace = () => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const { placeId } = useParams();
  const { isLoading, error, sendRequest, clearError } = useHttpClient();

  const [loadedPlace, setLoadedPlace] = useState();
  const [category, setCategory] = useState("");
  const [categoryTouched, setCategoryTouched] = useState(false);
  const [priceLevel, setPriceLevel] = useState("moderate");
  const [selectedTags, setSelectedTags] = useState([]);
  const [existingMedia, setExistingMedia] = useState([]);
  const [removedMedia, setRemovedMedia] = useState([]);
  const [mediaError, setMediaError] = useState("");

  const [formState, inputHandler, setFormData] = useForm(
    {
      title: {
        value: "",
        isValid: false,
      },
      description: {
        value: "",
        isValid: false,
      },
      address: {
        value: "",
        isValid: false,
      },
      addressNotes: {
        value: "",
        isValid: true,
      },
      media: {
        value: [],
        isValid: true,
      },
    },
    false,
  );

  const fetchPlace = useCallback(async () => {
    try {
      const responseData = await sendRequest(
        `http://localhost:5000/api/places/${placeId}`,
      );
      const place = responseData.place;

      setLoadedPlace(place);
      setCategory(place.category || "other");
      setPriceLevel(place.priceLevel || "moderate");
      setSelectedTags(place.tags || []);
      setExistingMedia(getPlaceMedia(place));
      setRemovedMedia([]);
      setMediaError("");

      setFormData(
        {
          title: {
            value: place.title,
            isValid: true,
          },
          description: {
            value: place.description,
            isValid: true,
          },
          address: {
            value: place.address,
            isValid: true,
          },
          addressNotes: {
            value: place.addressNotes || "",
            isValid: true,
          },
          media: {
            value: [],
            isValid: true,
          },
        },
        true,
      );
    } catch (err) {}
  }, [placeId, sendRequest, setFormData]);

  useEffect(() => {
    fetchPlace();
  }, [fetchPlace]);

  const remainingSlots = useMemo(
    () => Math.max(0, 8 - existingMedia.length),
    [existingMedia],
  );

  const removeExistingMediaHandler = (mediaUrl) => {
    setExistingMedia((prevMedia) =>
      prevMedia.filter((item) => item.url !== mediaUrl),
    );
    setRemovedMedia((prevRemoved) =>
      prevRemoved.includes(mediaUrl) ? prevRemoved : [...prevRemoved, mediaUrl],
    );
    setMediaError("");
  };

  const updatePlaceSubmitHandler = async (event) => {
    event.preventDefault();

    if (!category) {
      setCategoryTouched(true);
      return;
    }

    const newFiles = formState.inputs.media.value || [];
    const newMediaItems = newFiles.map((file) => ({
      type: file.type.startsWith("video/") ? "video" : "image",
    }));

    const finalMediaItems = [...existingMedia, ...newMediaItems];
    const hasImage = finalMediaItems.some((item) => item.type === "image");

    if (!finalMediaItems.length || !hasImage) {
      setMediaError("A place must keep at least one image in its gallery.");
      return;
    }

    setMediaError("");

    try {
      const formData = new FormData();
      formData.append("title", formState.inputs.title.value);
      formData.append("description", formState.inputs.description.value);
      formData.append("address", formState.inputs.address.value);
      formData.append("addressNotes", formState.inputs.addressNotes.value);
      formData.append("category", category);
      formData.append("priceLevel", priceLevel);
      formData.append("tags", JSON.stringify(selectedTags));
      formData.append("removedMedia", JSON.stringify(removedMedia));

      newFiles.forEach((file) => {
        formData.append("media", file);
      });

      await sendRequest(
        `http://localhost:5000/api/places/${placeId}`,
        "PATCH",
        formData,
        {
          authorization: `Cameleon ${auth.token}`,
        },
      );

      navigate(`/places/${placeId}/details`);
    } catch (err) {}
  };

  if (isLoading && !loadedPlace) {
    return (
      <div className="center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!loadedPlace && !error) {
    return (
      <div className="center">
        <Card>
          <h2>Could not find place!</h2>
        </Card>
      </div>
    );
  }

  return (
    <React.Fragment>
      <ErrorModal error={error} onClear={clearError} />

      {!isLoading && loadedPlace && (
        <form className="place-form" onSubmit={updatePlaceSubmitHandler}>
          <Input
            id="title"
            element="input"
            type="text"
            label="Title"
            validators={[VALIDATOR_REQUIRE()]}
            errorText="Please enter a valid title."
            onInput={inputHandler}
            initialValue={loadedPlace.title}
            initialValid={true}
          />

          <Input
            id="description"
            element="textarea"
            label="Description"
            validators={[VALIDATOR_REQUIRE(), VALIDATOR_MINLENGTH(5)]}
            errorText="Please enter a valid description (at least 5 characters)."
            onInput={inputHandler}
            initialValue={loadedPlace.description}
            initialValid={true}
          />

          <div className="place-form__row">
            <div className="place-form__field">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                onBlur={() => setCategoryTouched(true)}
              >
                <option value="">Select category</option>
                {categoryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {!category && categoryTouched && <p>Please select a category.</p>}
            </div>

            <div className="place-form__field">
              <label htmlFor="priceLevel">Price level</label>
              <select
                id="priceLevel"
                value={priceLevel}
                onChange={(event) => setPriceLevel(event.target.value)}
              >
                {priceLevelOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <MultiSelectDropdown
            label="Tags"
            options={tagOptions}
            selectedValues={selectedTags}
            onChange={setSelectedTags}
          />

          <Input
            id="address"
            element="input"
            type="text"
            label="Address"
            validators={[VALIDATOR_REQUIRE()]}
            errorText="Please enter a valid address."
            onInput={inputHandler}
            initialValue={loadedPlace.address}
            initialValid={true}
          />

          <Input
            id="addressNotes"
            element="textarea"
            label="Address notes (extra directions for users)"
            rows="4"
            validators={[]}
            errorText=""
            onInput={inputHandler}
            initialValue={loadedPlace.addressNotes || ""}
            initialValid={true}
          />

          <div className="place-form__existing-media">
            <label>Current gallery</label>
            <div className="place-form__media-grid">
              {existingMedia.map((item) => (
                <div key={item.url} className="place-form__media-item">
                  {item.type === "video" ? (
                    <video controls src={`http://localhost:5000/${item.url}`} />
                  ) : (
                    <img
                      src={`http://localhost:5000/${item.url}`}
                      alt="Place media"
                    />
                  )}
                  <button
                    type="button"
                    className="place-form__remove-media"
                    onClick={() => removeExistingMediaHandler(item.url)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <p className="place-form__hint">
              The cover image updates automatically to the first remaining image
              in the gallery.
            </p>
          </div>

          {remainingSlots > 0 ? (
            <MediaUpload
              id="media"
              center
              required={false}
              requireImage={false}
              maxFiles={remainingSlots}
              onInput={inputHandler}
              errorText={`You can add up to ${remainingSlots} more file${remainingSlots > 1 ? "s" : ""}.`}
            />
          ) : (
            <p className="place-form__hint">
              You have reached the maximum of 8 media files.
            </p>
          )}

          {mediaError && (
            <p className="place-form__media-error">{mediaError}</p>
          )}

          <Button
            type="submit"
            disabled={!formState.isValid || !category || isLoading}
          >
            SAVE PLACE CHANGES
          </Button>
        </form>
      )}
    </React.Fragment>
  );
};

export default UpdatePlace;
