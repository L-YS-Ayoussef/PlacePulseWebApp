import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import Modal from "../../Shared/Components/UIElement/Modal";
import ErrorModal from "../../Shared/Components/UIElement/ErrorModal";
import LoadingSpinner from "../../Shared/Components/UIElement/LoadingSpinner";
import Button from "../../Shared/Components/FormElements/Button";
import { useHttpClient } from "../../Shared/hooks/http-hook";
import { AuthContext } from "../../Shared/context/auth-context";
import { shareUrl } from "../../Shared/util/share";
import "./SaveToCollectionModal.css";

const toIdString = (value) => {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object") {
    if (value.id) {
      return String(value.id);
    }
    if (value._id) {
      return String(value._id);
    }
  }

  return String(value);
};

const normalizeCollection = (collection) => {
  const rawPlaceIds = Array.isArray(collection.placeIds)
    ? collection.placeIds
    : Array.isArray(collection.places)
      ? collection.places
      : [];

  const placeIds = rawPlaceIds.map((item) => toIdString(item)).filter(Boolean);

  return {
    ...collection,
    id: toIdString(collection.id || collection._id),
    placeIds,
    placeCount:
      typeof collection.placeCount === "number"
        ? collection.placeCount
        : placeIds.length,
  };
};

const SaveToCollectionModal = ({ show, onCancel, placeId, placeTitle }) => {
  const auth = useContext(AuthContext);
  const { isLoading, error, sendRequest, clearError } = useHttpClient();

  const [collections, setCollections] = useState([]);
  const [newCollectionName, setNewCollectionName] = useState("");
  
  const [finishSaving, setFinishSaving] = useState("");

  const activePlaceId = useMemo(() => toIdString(placeId), [placeId]);

  const fetchCollections = useCallback(async () => {
    if (!show || !auth.userId) {
      return;
    }

    try {
      const responseData = await sendRequest(
        `http://localhost:5000/api/collections/user/${auth.userId}`,
        "GET",
        null,
        {
          authorization: `Cameleon ${auth.token}`,
        },
      );

      setCollections(
        (responseData.collections || []).map((collection) =>
          normalizeCollection(collection),
        ),
      );
    } catch (err) {}
  }, [show, auth.userId, auth.token, sendRequest]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const collectionContainsPlace = useCallback(
    (collection) => {
      return (collection.places || collection.placeIds || []).includes(
        activePlaceId,
      );
    },
    [activePlaceId],
  );

  const createCollectionHandler = async () => {
    const trimmedName = newCollectionName.trim();

    if (!trimmedName) {
      return;
    }

    try {
      const responseData = await sendRequest(
        "http://localhost:5000/api/collections",
        "POST",
        JSON.stringify({
          name: trimmedName,
          placeId: activePlaceId,
        }),
        {
          "Content-Type": "application/json",
          authorization: `Cameleon ${auth.token}`,
        },
      );

      const createdCollection = normalizeCollection(responseData.collection);

      setCollections((prevCollections) => [
        createdCollection,
        ...prevCollections,
      ]);
      setNewCollectionName("");
    } catch (err) {}
  };

  const togglePlaceHandler = async (collection) => {
    const collectionId = toIdString(collection.id);
    const isCurrentlySaved = collectionContainsPlace(collection);

    try {
      if (isCurrentlySaved) {
        await sendRequest(
          `http://localhost:5000/api/collections/${collectionId}/places/${activePlaceId}`,
          "DELETE",
          null,
          {
            authorization: `Cameleon ${auth.token}`,
          },
        );

        await fetchCollections();
      } else {
        await sendRequest(
          `http://localhost:5000/api/collections/${collectionId}/places`,
          "POST",
          JSON.stringify({ placeId: activePlaceId }),
          {
            "Content-Type": "application/json",
            authorization: `Cameleon ${auth.token}`,
          },
        );

        await fetchCollections();
      }
    } catch (err) {}
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
        text: `Check out my collection "${collection.name}".`,
        url: responseData.shareUrl,
      });

      setCollections((prevCollections) =>
        prevCollections.map((item) =>
          item.id === collection.id ? { ...item, isPublic: true } : item,
        ),
      );
    } catch (err) {}
  };

  return (
    <React.Fragment>
      <ErrorModal error={error} onClear={clearError} />

      <Modal
        show={show}
        onCancel={onCancel}
        header="Save to collection"
        className="save-collection-modal"
        contentClass="save-collection-modal__content"
        footerClass="save-collection-modal__footer"
        footer={
          <Button type="button" inverse onClick={onCancel}>
            CLOSE
          </Button>
        }
      >
        {isLoading && <LoadingSpinner asOverlay />}

        <p className="save-collection-modal__intro">
          Save <strong>{placeTitle}</strong> to one or more collections.
        </p>

        <div className="save-collection-modal__create">
          <label htmlFor="collectionName">Create a new collection</label>

          <div className="save-collection-modal__create-row">
            <input
              id="collectionName"
              type="text"
              value={newCollectionName}
              onChange={(event) => setNewCollectionName(event.target.value)}
              placeholder="For example: Weekend Cafés"
            />
            <Button
              type="button"
              onClick={createCollectionHandler}
              disabled={!newCollectionName.trim()}
            >
              CREATE
            </Button>
          </div>
        </div>

        <div className="save-collection-modal__list">
          {collections.length === 0 ? (
            <p className="save-collection-modal__empty">
              No collections yet. Create your first one above.
            </p>
          ) : (
            collections.map((collection) => {
              const isSaved = collectionContainsPlace(collection);

              return (
                <div
                  key={collection.id}
                  className="save-collection-modal__item"
                >
                  <div className="save-collection-modal__item-info">
                    <h3>{collection.name}</h3>
                    <p>
                      {collection.placeCount || 0}{" "}
                      {(collection.placeCount || 0) === 1
                        ? "saved place"
                        : "saved places"}
                      {collection.isPublic ? " · Public" : " · Private"}
                    </p>
                  </div>

                  <div className="save-collection-modal__item-actions">
                    <Button
                      type="button"
                      inverse
                      onClick={() => togglePlaceHandler(collection)}
                    >
                      {isSaved ? "UNSAVE" : "SAVE"}
                    </Button>

                    <Button
                      type="button"
                      inverse
                      onClick={() => shareCollectionHandler(collection)}
                    >
                      SHARE
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Modal>
    </React.Fragment>
  );
};

export default SaveToCollectionModal;
