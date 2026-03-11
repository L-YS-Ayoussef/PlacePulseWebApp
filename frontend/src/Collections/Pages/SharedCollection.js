import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import Card from "../../Shared/Components/UIElement/Card";
import Avatar from "../../Shared/Components/UIElement/Avatar";
import Button from "../../Shared/Components/FormElements/Button";
import ErrorModal from "../../Shared/Components/UIElement/ErrorModal";
import LoadingSpinner from "../../Shared/Components/UIElement/LoadingSpinner";
import PlaceList from "../../Places/Components/PlaceList";
import { useHttpClient } from "../../Shared/hooks/http-hook";
import { shareUrl } from "../../Shared/util/share";
import "./SharedCollection.css";

const SharedCollection = () => {
  const { shareToken } = useParams();
  const { isLoading, error, sendRequest, clearError } = useHttpClient();

  const [collection, setCollection] = useState();

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        const responseData = await sendRequest(
          `http://localhost:5000/api/collections/shared/${shareToken}`,
        );
        setCollection(responseData.collection);
      } catch (err) {}
    };

    fetchCollection();
  }, [sendRequest, shareToken]);

  const shareCollectionHandler = async () => {
    if (!collection) {
      return;
    }

    try {
      await shareUrl({
        title: collection.name,
        text: `Check out this collection by ${collection.owner?.name || "a user"}.`,
        url: window.location.href,
      });
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
          <h2>Could not find this shared collection.</h2>
        </Card>
      </div>
    );
  }

  return (
    <React.Fragment>
      <ErrorModal error={error} onClear={clearError} />

      {collection && (
        <div className="shared-collection">
          <Card className="shared-collection__header">
            <div className="shared-collection__owner">
              {collection.owner?.image && (
                <Avatar
                  className="shared-collection__avatar"
                  image={`http://localhost:5000/${collection.owner.image}`}
                  alt={collection.owner?.name || collection.name}
                />
              )}

              <div className="shared-collection__owner-info">
                <h1>{collection.name}</h1>
                {collection.owner && (
                  <p>
                    Curated by{" "}
                    <Link to={`/${collection.owner.id}/places`}>
                      {collection.owner.name}
                    </Link>
                  </p>
                )}
              </div>
            </div>

            <div className="shared-collection__actions">
              <Button inverse onClick={shareCollectionHandler}>
                SHARE COLLECTION
              </Button>
            </div>
          </Card>

          {collection.places && collection.places.length > 0 ? (
            <PlaceList
              items={collection.places}
              layout="grid"
              hideOwnerActions={true}
            />
          ) : (
            <div className="center">
              <Card>
                <h2>No places in this collection yet.</h2>
              </Card>
            </div>
          )}
        </div>
      )}
    </React.Fragment>
  );
};

export default SharedCollection;
