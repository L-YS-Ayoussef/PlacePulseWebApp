import React, { useState, useContext } from 'react';

import Card from '../../Shared/Components/UIElement/Card';
import Button from "../../Shared/Components/FormElements/Button";
import Modal from "../../Shared/Components/UIElement/Modal";
// import MapModal from '../../Shared/Components/UIElement/Map';
import MapModal2 from '../../Shared/Components/UIElement/Map2';
import ErrorModal from '../../Shared/Components/UIElement/ErrorModal';
import LoadingSpinner from '../../Shared/Components/UIElement/LoadingSpinner';

import { useHttpClient } from '../../Shared/hooks/http-hook';
import {AuthContext} from "../../Shared/context/auth-context";
import './PlaceItem.css';

const PlaceItem = props => {
  const auth = useContext(AuthContext);
  const { isLoading, error, sendRequest, clearError } = useHttpClient();
  const [showMap, setShowMap] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const openMap = () => setShowMap(true);
  const closeMap = () => setShowMap(false);

  const showDeleteWarningHandler = () => {
    setShowConfirmModal(true);
  };
  const cancelDeleteHandler = () => {
    setShowConfirmModal(false);
  };

  const confirmDeleteHandler = async () => {
    setShowConfirmModal(false);
    try {
      await sendRequest(
        `http://localhost:5000/api/places/${props.id}`,
        'DELETE', 
        null, 
        { 'authorization': `Cameleon ${auth.token}` }
      );
      props.onDelete(props.id);
    } catch (err) { }
  };


  return (
    <React.Fragment>
      <ErrorModal error={error} onClear={clearError} />
      <Modal
        show={showMap}
        onCancel={closeMap}
        header={props.address}
        contentClass={"place-item__modal-content"}
        footerClass={"place-item__modal-actions"}
        footer={<Button onClick={closeMap}>CLOSE</Button>}
      >
        <div className='map-container'>
          <MapModal2 center={props.coordinates} zoom={16} />
        </div>
      </Modal>

      <Modal
        show={showConfirmModal}
        onCancel={cancelDeleteHandler}
        header="Are you sure?"
        footerClass="place-item__modal-actions"
        footer={
          <React.Fragment>
            <Button inverse onClick={cancelDeleteHandler}>
              CANCEL
            </Button>
            <Button danger onClick={confirmDeleteHandler}>
              DELETE
            </Button>
          </React.Fragment>
        }
      >
        <p>
          Do you want to proceed and delete this place? Please note that it
          can't be undone thereafter.
        </p>
      </Modal>

      <li className="place-item">
        <Card className="place-item__content">
          {isLoading && <LoadingSpinner asOverlay />}
          <div className="place-item__image">
            <img src={`http://localhost:5000/${props.image}`} alt={props.title} />
          </div>
          <div className="place-item__info">
            <h2>{props.title}</h2>
            <h3>{props.address}</h3>
            <p>{props.description}</p>
          </div>
          <div className="place-item__actions">
            <Button inverse onClick={openMap}>VIEW ON MAP</Button>
            {(auth.userId === props.creatorId) && <Button to={`/places/${props.id}`}>EDIT</Button>}
            {(auth.userId === props.creatorId) && <Button danger onClick={showDeleteWarningHandler}>DELETE</Button>}
          </div>
        </Card>
      </li>
    </React.Fragment>
  );
};

export default PlaceItem;
