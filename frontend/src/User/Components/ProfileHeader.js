import React from "react";

import Avatar from "../../Shared/Components/UIElement/Avatar";
import Button from "../../Shared/Components/FormElements/Button";
import "./ProfileHeader.css";

const ProfileHeader = ({ user, placeCount, canEdit, onEdit }) => {
  return (
    <div className="profile-header">
      <div className="profile-header__content">
        <Avatar
          className="profile-header__avatar"
          image={`http://localhost:5000/${user.image}`}
          alt={user.name}
        />

        <div className="profile-header__info">
          <h1>{user.name}</h1>
          <p>
            {placeCount} {placeCount === 1 ? "place" : "places"} shared
          </p>
        </div>

        {canEdit && (
          <div className="profile-header__actions">
            <Button onClick={onEdit}>EDIT PROFILE</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileHeader;
