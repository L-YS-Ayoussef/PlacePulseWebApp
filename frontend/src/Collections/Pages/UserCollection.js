import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Card from "../../Shared/Components/UIElement/Card";
import Button from "../../Shared/Components/FormElements/Button";
import Modal from "../../Shared/Components/UIElement/Modal";
import ErrorModal from "../../Shared/Components/UIElement/ErrorModal";
import LoadingSpinner from "../../Shared/Components/UIElement/LoadingSpinner";
import PlaceList from "../../Places/Components/PlaceList";
import { useHttpClient } from "../../Shared/hooks/http-hook";
import { AuthContext } from "../../Shared/context/auth-context";
import { shareUrl } from "../../Shared/util/share";
import "./UserCollection.css";

const UserCollection = () => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const { collectionId } = useParams();
  const { isLoading, error, sendRequest, clearError } = useHttpClient();

  const [collection, setCollection] = useState();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        const responseData = await sendRequest(
          `http://localhost:5000/api/collections/${collectionId}`,
          "GET",
          null,
          {
            authorization: `Cameleon ${auth.token}`,
          },
        );

        setCollection(responseData.collection);
      } catch (err) {}
    };

    fetchCollection();
  }, [sendRequest, collectionId, auth.token]);

  const unsavePlaceHandler = async (placeId) => {
    try {
      await sendRequest(
        `http://localhost:5000/api/collections/${collectionId}/places/${placeId}`,
        "DELETE",
        null,
        {
          authorization: `Cameleon ${auth.token}`,
        },
      );

      setCollection((prevCollection) => ({
        ...prevCollection,
        places: prevCollection.places.filter((place) => place.id !== placeId),
      }));
    } catch (err) {}
  };

  const shareCollectionHandler = async () => {
    try {
      const responseData = await sendRequest(
        `http://localhost:5000/api/collections/${collectionId}/share`,
        "PATCH",
        null,
        {
          authorization: `Cameleon ${auth.token}`,
        },
      );

      await shareUrl({
        title: collection.name,
        text: `Check out my collection "${collection.name}".`,
        url: responseData.shareUrl,
      });
    } catch (err) {}
  };

  const openDeleteModalHandler = () => {
    setShowDeleteModal(true);
  };

  const closeDeleteModalHandler = () => {
    setShowDeleteModal(false);
  };

  const confirmDeleteCollectionHandler = async () => {
    try {
      await sendRequest(
        `http://localhost:5000/api/collections/${collectionId}`,
        "DELETE",
        null,
        {
          authorization: `Cameleon ${auth.token}`,
        },
      );

      navigate(`/${auth.userId}/places`);
    } catch (err) {}
  };

  if (isLoading && !collection) {
    return (
      <div className="center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!collection && !error) {
    return (
      <div className="center">
        <Card>
          <h2>Could not find this collection.</h2>
        </Card>
      </div>
    );
  }

  return (
    <React.Fragment>
      <ErrorModal error={error} onClear={clearError} />

      <Modal
        show={showDeleteModal}
        onCancel={closeDeleteModalHandler}
        header="Delete collection?"
        footerClass="place-item__modal-actions"
        footer={
          <React.Fragment>
            <Button inverse onClick={closeDeleteModalHandler}>
              CANCEL
            </Button>
            <Button danger onClick={confirmDeleteCollectionHandler}>
              DELETE
            </Button>
          </React.Fragment>
        }
      >
        <p>
          Are you sure you want to delete <strong>{collection?.name}</strong>?
          This cannot be undone.
        </p>
      </Modal>

      {collection && (
        <div className="user-collection-page">
          <Card className="user-collection-page__header">
            <div className="user-collection-page__header-top">
              <div>
                <h1>{collection.name}</h1>
                <p>
                  {collection.places.length}{" "}
                  {collection.places.length === 1
                    ? "saved place"
                    : "saved places"}
                </p>
              </div>

              <div className="user-collection-page__actions">
                <Button inverse onClick={shareCollectionHandler}>
                  SHARE
                </Button>
                <Button danger onClick={openDeleteModalHandler}>
                  DELETE
                </Button>
              </div>
            </div>
          </Card>

          <h2 className="user-collection-page__heading">
            Places in this Collection
          </h2>

          {collection.places.length > 0 ? (
            <PlaceList
              items={collection.places}
              layout="grid"
              hideOwnerActions={true}
              saveButtonText="UNSAVE"
              onSavePlace={unsavePlaceHandler}
            />
          ) : (
            <div className="center">
              <Card>
                <h2>No saved places in this collection yet.</h2>
              </Card>
            </div>
          )}
        </div>
      )}
    </React.Fragment>
  );
};

export default UserCollection;
