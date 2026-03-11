import React, { useCallback, useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import PlaceList from "../Components/PlaceList";
import ErrorModal from "../../Shared/Components/UIElement/ErrorModal";
import LoadingSpinner from "../../Shared/Components/UIElement/LoadingSpinner";
import Card from "../../Shared/Components/UIElement/Card";
import Button from "../../Shared/Components/FormElements/Button";
import Modal from "../../Shared/Components/UIElement/Modal";
import ProfileHeader from "../../User/Components/ProfileHeader";
import EditProfileModal from "../../User/Components/EditProfileModal";
import { useHttpClient } from "../../Shared/hooks/http-hook";
import { AuthContext } from "../../Shared/context/auth-context";
import { shareUrl } from "../../Shared/util/share";
import "./UserPlaces.css";

const UserPlaces = () => {
  const auth = useContext(AuthContext);
  const { isLoading, error, sendRequest, clearError } = useHttpClient();
  const { userId } = useParams();

  const [loadedUser, setLoadedUser] = useState();
  const [loadedPlaces, setLoadedPlaces] = useState([]);
  const [loadedCollections, setLoadedCollections] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState(null);

  const isOwnProfile = auth.isLoggedIn && auth.userId === userId;

  const fetchProfileData = useCallback(async () => {
    try {
      const userResponse = await sendRequest(
        `http://localhost:5000/api/users/${userId}`,
      );
      setLoadedUser(userResponse.user);

      const placesResponse = await sendRequest(
        `http://localhost:5000/api/places/user/${userId}`,
      );
      setLoadedPlaces(placesResponse.places);

      if (isOwnProfile) {
        const collectionsResponse = await sendRequest(
          `http://localhost:5000/api/collections/user/${userId}`,
          "GET",
          null,
          {
            authorization: `Cameleon ${auth.token}`,
          },
        );
        setLoadedCollections(collectionsResponse.collections || []);
      } else {
        setLoadedCollections([]);
      }
    } catch (err) {}
  }, [sendRequest, userId, isOwnProfile, auth.token]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const placeDeletedHandler = (deletedPlaceId) => {
    setLoadedPlaces((prevPlaces) =>
      prevPlaces.filter((place) => place.id !== deletedPlaceId),
    );

    setLoadedCollections((prevCollections) =>
      prevCollections.map((collection) => {
        const nextPlaceIds = (collection.placeIds || []).filter(
          (placeId) => placeId !== deletedPlaceId,
        );

        return {
          ...collection,
          placeIds: nextPlaceIds,
          placeCount: nextPlaceIds.length,
        };
      }),
    );
  };

  const profileUpdatedHandler = (updatedUser) => {
    setLoadedUser(updatedUser);
    setShowEditModal(false);
  };

  const shareCollectionHandler = async (collection) => {
    try {
      const responseData = await sendRequest(
        `http://localhost:5000/api/collections/${collection.id}/share`,
        "PATCH",
        null,
        {
          authorization: `Cameleon ${auth.token}`,
        },
      );

      await shareUrl({
        title: collection.name,
        text: `Check out this collection by ${loadedUser?.name || "a user"}.`,
        url: responseData.shareUrl,
      });
    } catch (err) {}
  };

  const openDeleteCollectionModal = (collection) => {
    setCollectionToDelete(collection);
  };

  const closeDeleteCollectionModal = () => {
    setCollectionToDelete(null);
  };

  const confirmDeleteCollectionHandler = async () => {
    if (!collectionToDelete) {
      return;
    }

    try {
      await sendRequest(
        `http://localhost:5000/api/collections/${collectionToDelete.id}`,
        "DELETE",
        null,
        {
          authorization: `Cameleon ${auth.token}`,
        },
      );

      setLoadedCollections((prevCollections) =>
        prevCollections.filter(
          (collection) => collection.id !== collectionToDelete.id,
        ),
      );

      setCollectionToDelete(null);
    } catch (err) {}
  };

  return (
    <React.Fragment>
      <ErrorModal error={error} onClear={clearError} />

      <Modal
        show={!!collectionToDelete}
        onCancel={closeDeleteCollectionModal}
        header="Delete collection?"
        footerClass="place-item__modal-actions"
        footer={
          <React.Fragment>
            <Button inverse onClick={closeDeleteCollectionModal}>
              CANCEL
            </Button>
            <Button danger onClick={confirmDeleteCollectionHandler}>
              DELETE
            </Button>
          </React.Fragment>
        }
      >
        <p>
          Are you sure you want to delete{" "}
          <strong>{collectionToDelete?.name}</strong>? This cannot be undone.
        </p>
      </Modal>

      {loadedUser && (
        <EditProfileModal
          show={showEditModal}
          onCancel={() => setShowEditModal(false)}
          user={loadedUser}
          onProfileUpdated={profileUpdatedHandler}
        />
      )}

      {isLoading && !loadedUser && (
        <div className="center">
          <LoadingSpinner />
        </div>
      )}

      {!isLoading && loadedUser && (
        <div className="user-profile-page">
          <Card className="user-profile-page__overview-card">
            <ProfileHeader
              user={loadedUser}
              placeCount={loadedPlaces.length}
              canEdit={isOwnProfile}
              onEdit={() => setShowEditModal(true)}
            />

            {isOwnProfile && (
              <React.Fragment>
                <div className="user-profile-page__divider" />

                <section className="user-profile-page__collections">
                  <div className="user-profile-page__collections-header">
                    <div>
                      <h2>Your collections</h2>
                      <p>Collections you created from saved places.</p>
                    </div>
                  </div>

                  {loadedCollections.length === 0 ? (
                    <p className="user-profile-page__collections-empty">
                      No collections yet. Save a place to create your first one.
                    </p>
                  ) : (
                    <div className="user-profile-page__collection-list">
                      {loadedCollections.map((collection) => (
                        <div
                          key={collection.id}
                          className="user-profile-page__collection-item"
                        >
                          <div>
                            <h3>
                              <Link to={`/collections/${collection.id}`}>
                                {collection.name}
                              </Link>
                            </h3>
                            <p>
                              {collection.placeCount || 0}{" "}
                              {(collection.placeCount || 0) === 1
                                ? "saved place"
                                : "saved places"}
                            </p>
                          </div>

                          <div className="user-profile-page__collection-actions">
                            <Button
                              type="button"
                              inverse
                              onClick={() => shareCollectionHandler(collection)}
                            >
                              SHARE
                            </Button>
                            <Button
                              type="button"
                              danger
                              onClick={() =>
                                openDeleteCollectionModal(collection)
                              }
                            >
                              DELETE
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </React.Fragment>
            )}
          </Card>

          <h2 className="user-profile-page__places-heading">Your Places</h2>

          <PlaceList items={loadedPlaces} onDeletePlace={placeDeletedHandler} />
        </div>
      )}
    </React.Fragment>
  );
};

export default UserPlaces;
