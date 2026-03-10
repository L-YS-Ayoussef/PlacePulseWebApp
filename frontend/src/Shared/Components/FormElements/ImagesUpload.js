import React, { useEffect, useRef, useState } from "react";

import Button from "./Button";
import "./ImagesUpload.css";

const fileKey = (file) => `${file.name}-${file.size}-${file.lastModified}`;

const imageMimeTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

const ImagesUpload = (props) => {
  const filePickerRef = useRef();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewItems, setPreviewItems] = useState([]);
  const [isValid, setIsValid] = useState(!props.required);
  const [isDragActive, setIsDragActive] = useState(false);

  useEffect(() => {
    return () => {
      previewItems.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, [previewItems]);

  const syncState = (files) => {
    const valid = props.required ? files.length > 0 : true;

    setSelectedFiles(files);
    setIsValid(valid);
    props.onInput(props.id, files, valid);

    setPreviewItems(
      files.map((file) => ({
        key: fileKey(file),
        previewUrl: URL.createObjectURL(file),
        name: file.name,
      })),
    );
  };

  const mergeFiles = (incomingFiles) => {
    const maxFiles = props.maxFiles || 4;
    const merged = [...selectedFiles];

    incomingFiles.forEach((file) => {
      if (
        !merged.some((existingFile) => fileKey(existingFile) === fileKey(file))
      ) {
        merged.push(file);
      }
    });

    if (merged.length > maxFiles) {
      setIsValid(false);
      props.onInput(props.id, selectedFiles, false);
      return;
    }

    syncState(merged);
  };

  const pickedHandler = (event) => {
    const pickedFiles = Array.from(event.target.files || []).filter((file) =>
      imageMimeTypes.includes(file.type),
    );

    if (pickedFiles.length) {
      mergeFiles(pickedFiles);
    }

    event.target.value = "";
  };

  const removeItemHandler = (keyToRemove) => {
    const remainingFiles = selectedFiles.filter(
      (file) => fileKey(file) !== keyToRemove,
    );
    syncState(remainingFiles);
  };

  const pickImageHandler = () => {
    filePickerRef.current.click();
  };

  const dragOverHandler = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(true);
  };

  const dragLeaveHandler = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);
  };

  const dropHandler = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);

    const droppedFiles = Array.from(event.dataTransfer.files || []).filter(
      (file) => imageMimeTypes.includes(file.type),
    );

    if (droppedFiles.length) {
      mergeFiles(droppedFiles);
    }
  };

  return (
    <div className="form-control">
      <input
        id={props.id}
        ref={filePickerRef}
        style={{ display: "none" }}
        type="file"
        accept=".jpg,.png,.jpeg,.webp"
        multiple
        onChange={pickedHandler}
      />

      <div className={`image-upload ${props.center ? "center" : ""}`}>
        <div
          className={`images-upload__dropzone ${isDragActive ? "images-upload__dropzone--active" : ""}`}
          onDragOver={dragOverHandler}
          onDragLeave={dragLeaveHandler}
          onDrop={dropHandler}
        >
          <div className="images-upload__preview-grid">
            {previewItems.length > 0 ? (
              previewItems.map((item) => (
                <div key={item.key} className="images-upload__preview-item">
                  <img src={item.previewUrl} alt={item.name} />
                  <button
                    type="button"
                    className="images-upload__remove-btn"
                    onClick={() => removeItemHandler(item.key)}
                  >
                    ×
                  </button>
                </div>
              ))
            ) : (
              <p className="images-upload__empty">
                Drag & drop up to {props.maxFiles || 4} photos here, or pick
                them from your device.
              </p>
            )}
          </div>
        </div>

        <Button type="button" onClick={pickImageHandler}>
          PICK PHOTOS
        </Button>
      </div>

      {!isValid && <p>{props.errorText}</p>}
    </div>
  );
};

export default ImagesUpload;
