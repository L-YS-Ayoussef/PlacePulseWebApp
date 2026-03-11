import React from "react";

import Card from "../../Shared/Components/UIElement/Card";
import Button from "../../Shared/Components/FormElements/Button";
import PlaceItem from "./PlaceItem";
import "./PlaceList.css";

const PlaceList = (props) => {
  if (props.items.length === 0) {
    return (
      <div className="place-list center">
        <Card>
          <h2>No places found. Maybe create one?</h2>
          <Button to="/places/new">Share Place</Button>
        </Card>
      </div>
    );
  }

  const listClasses = `place-list ${
    props.layout === "grid" ? "place-list--grid" : "place-list--list"
  }`;

  return (
    <ul className={listClasses}>
      {props.items.map((place) => {
        const creatorId =
          typeof place.creator === "object" ? place.creator.id : place.creator;
        const creatorName =
          typeof place.creator === "object" ? place.creator.name : "";

        return (
          <PlaceItem
            key={place.id}
            id={place.id}
            image={place.image}
            title={place.title}
            description={place.description}
            address={place.address}
            creatorId={creatorId}
            creatorName={creatorName}
            coordinates={place.location}
            averageRating={place.averageRating}
            reviewCount={place.reviewCount}
            reviewImagesCount={place.reviewImagesCount}
            createdAt={place.createdAt}
            updatedAt={place.updatedAt}
            hideOwnerActions={props.hideOwnerActions}
            saveButtonText={props.saveButtonText}
            onSavePlace={props.onSavePlace}
            onDelete={props.onDeletePlace}
          />
        );
      })}
    </ul>
  );
};

export default PlaceList;
