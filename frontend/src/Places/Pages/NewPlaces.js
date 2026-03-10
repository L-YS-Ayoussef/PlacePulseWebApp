import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

import Input from "../../Shared/Components/FormElements/Input";
import Button from "../../Shared/Components/FormElements/Button";
import ErrorModal from "../../Shared/Components/UIElement/ErrorModal";
import LoadingSpinner from "../../Shared/Components/UIElement/LoadingSpinner";
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

const NewPlace = () => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const { isLoading, error, sendRequest, clearError } = useHttpClient();

  const [category, setCategory] = useState("");
  const [priceLevel, setPriceLevel] = useState("moderate");
  const [selectedTags, setSelectedTags] = useState([]);
  const [categoryTouched, setCategoryTouched] = useState(false);

  const [formState, inputHandler] = useForm(
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
        isValid: false,
      },
    },
    false,
  );

  const placeSubmitHandler = async (event) => {
    event.preventDefault();

    if (!category) {
      setCategoryTouched(true);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", formState.inputs.title.value);
      formData.append("description", formState.inputs.description.value);
      formData.append("address", formState.inputs.address.value);
      formData.append("addressNotes", formState.inputs.addressNotes.value);
      formData.append("category", category);
      formData.append("priceLevel", priceLevel);
      formData.append("tags", JSON.stringify(selectedTags));

      (formState.inputs.media.value || []).forEach((file) => {
        formData.append("media", file);
      });

      await sendRequest("http://localhost:5000/api/places", "POST", formData, {
        authorization: `Cameleon ${auth.token}`,
      });

      navigate("/");
    } catch (err) {}
  };

  return (
    <React.Fragment>
      <ErrorModal error={error} onClear={clearError} />
      <form className="place-form" onSubmit={placeSubmitHandler}>
        {isLoading && <LoadingSpinner asOverlay />}

        <Input
          id="title"
          element="input"
          type="text"
          label="Title"
          validators={[VALIDATOR_REQUIRE()]}
          errorText="Please enter a valid title."
          onInput={inputHandler}
        />

        <Input
          id="description"
          element="textarea"
          label="Description"
          validators={[VALIDATOR_REQUIRE(), VALIDATOR_MINLENGTH(5)]}
          errorText="Please enter a valid description (at least 5 characters)."
          onInput={inputHandler}
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
          label="Address (used for map coordinates)"
          validators={[VALIDATOR_REQUIRE()]}
          errorText="Please enter a valid address."
          onInput={inputHandler}
        />

        <Input
          id="addressNotes"
          element="textarea"
          label="Address notes (extra directions for users)"
          rows="4"
          validators={[]}
          errorText=""
          onInput={inputHandler}
        />

        <MediaUpload
          id="media"
          center
          required
          requireImage
          maxFiles={8}
          onInput={inputHandler}
          errorText="Please upload up to 8 files and include at least one image."
        />

        <Button
          type="submit"
          disabled={!formState.isValid || !category || isLoading}
        >
          ADD PLACE
        </Button>
      </form>
    </React.Fragment>
  );
};

export default NewPlace;
