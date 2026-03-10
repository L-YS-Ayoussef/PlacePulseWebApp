import React, { useEffect, useRef, useState } from "react";

import Button from "./Button";
import "./MediaUpload.css";

const fileKey = (file) => `${file.name}-${file.size}-${file.lastModified}`;

const acceptedMediaTypes = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

const MediaUpload = (props) => {
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
    const hasImage = files.some((file) => file.type.startsWith("image/"));
    const valid = props.required
      ? files.length > 0 && (!props.requireImage || hasImage)
      : true;

    setSelectedFiles(files);
    setIsValid(valid);
    props.onInput(props.id, files, valid);

    setPreviewItems(
      files.map((file) => ({
        key: fileKey(file),
        previewUrl: URL.createObjectURL(file),
        type: file.type.startsWith("video/") ? "video" : "image",
        name: file.name,
      })),
    );
  };

  const mergeFiles = (incomingFiles) => {
    const maxFiles = props.maxFiles || 8;
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
      acceptedMediaTypes.includes(file.type),
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

  const pickMediaHandler = () => {
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
      (file) => acceptedMediaTypes.includes(file.type),
    );

    if (droppedFiles.length) {
      mergeFiles(droppedFiles);
    }
  };

  return (
    <div className="form-control">
      <input
        ref={filePickerRef}
        id={props.id}
        style={{ display: "none" }}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,video/mp4,video/webm,video/quicktime"
        multiple
        onChange={pickedHandler}
      />

      <div className={`media-upload ${props.center ? "center" : ""}`}>
        <div
          className={`media-upload__dropzone ${isDragActive ? "media-upload__dropzone--active" : ""}`}
          onDragOver={dragOverHandler}
          onDragLeave={dragLeaveHandler}
          onDrop={dropHandler}
        >
          <div className="media-upload__preview-grid">
            {previewItems.length > 0 ? (
              previewItems.map((item) => (
                <div key={item.key} className="media-upload__preview-item">
                  {item.type === "video" ? (
                    <video src={item.previewUrl} controls />
                  ) : (
                    <img src={item.previewUrl} alt={item.name} />
                  )}
                  <button
                    type="button"
                    className="media-upload__remove-btn"
                    onClick={() => removeItemHandler(item.key)}
                  >
                    ×
                  </button>
                </div>
              ))
            ) : (
              <p className="media-upload__empty">
                Drag & drop up to {props.maxFiles || 8} files here, or pick them
                from your device. At least one must be an image.
              </p>
            )}
          </div>
        </div>

        <Button type="button" onClick={pickMediaHandler}>
          PICK MEDIA
        </Button>
      </div>

      {!isValid && <p>{props.errorText}</p>}
    </div>
  );
};

export default MediaUpload;
