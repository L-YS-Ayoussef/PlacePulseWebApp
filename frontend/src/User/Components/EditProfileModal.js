import React, { useContext, useEffect } from "react";

import Modal from "../../Shared/Components/UIElement/Modal";
import ErrorModal from "../../Shared/Components/UIElement/ErrorModal";
import LoadingSpinner from "../../Shared/Components/UIElement/LoadingSpinner";
import Input from "../../Shared/Components/FormElements/Input";
import ImageUpload from "../../Shared/Components/FormElements/ImageUpload";
import Button from "../../Shared/Components/FormElements/Button";
import { useForm } from "../../Shared/hooks/form-hook";
import { useHttpClient } from "../../Shared/hooks/http-hook";
import { VALIDATOR_REQUIRE } from "../../Shared/util/validators";
import { AuthContext } from "../../Shared/context/auth-context";
import "./EditProfileModal.css";

const EditProfileModal = ({ show, onCancel, user, onProfileUpdated }) => {
  const auth = useContext(AuthContext);
  const { isLoading, error, sendRequest, clearError } = useHttpClient();

  const [formState, inputHandler, setFormData] = useForm(
    {
      name: {
        value: user?.name || "",
        isValid: !!user?.name,
      },
      image: {
        value: null,
        isValid: true,
      },
    },
    !!user?.name,
  );

  useEffect(() => {
    setFormData(
      {
        name: {
          value: user?.name || "",
          isValid: !!user?.name,
        },
        image: {
          value: null,
          isValid: true,
        },
      },
      !!user?.name,
    );
  }, [user, setFormData, show]);

  const submitHandler = async (event) => {
    event.preventDefault();

    const formData = new FormData();
    formData.append("name", formState.inputs.name.value);

    if (formState.inputs.image.value) {
      formData.append("image", formState.inputs.image.value);
    }

    try {
      const responseData = await sendRequest(
        `http://localhost:5000/api/users/${user.id}`,
        "PATCH",
        formData,
        {
          authorization: `Cameleon ${auth.token}`,
        },
      );

      onProfileUpdated(responseData.user);
    } catch (err) {}
  };

  if (!user) {
    return null;
  }

  return (
    <React.Fragment>
      <ErrorModal error={error} onClear={clearError} />

      <Modal
        show={show}
        onCancel={onCancel}
        onSubmit={submitHandler}
        header="Edit profile"
        className="edit-profile-modal"
        contentClass="edit-profile-modal__content"
        footerClass="edit-profile-modal__footer"
        footer={
          <React.Fragment>
            <Button type="button" inverse onClick={onCancel}>
              CANCEL
            </Button>
            <Button type="submit" disabled={!formState.isValid || isLoading}>
              SAVE
            </Button>
          </React.Fragment>
        }
      >
        {isLoading && <LoadingSpinner asOverlay />}

        <Input
          id="name"
          element="input"
          type="text"
          label="Your name"
          validators={[VALIDATOR_REQUIRE()]}
          errorText="Please enter your name."
          onInput={inputHandler}
          initialValue={user.name}
          initialValid={true}
        />

        <ImageUpload
          id="image"
          center
          required={false}
          onInput={inputHandler}
          errorText="Please provide a valid image."
          initialImage={`http://localhost:5000/${user.image}`}
        />
      </Modal>
    </React.Fragment>
  );
};

export default EditProfileModal;
