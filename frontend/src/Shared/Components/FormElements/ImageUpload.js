import React, { useEffect, useRef, useState } from "react";

import Button from "./Button";
import "./ImageUpload.css";

const ImageUpload = (props) => {
  const filePickerRef = useRef();
  const [file, setFile] = useState();
  const [previewUrl, setPreviewUrl] = useState();
  const [isValid, setIsValid] = useState(!props.required);
  const [isDragActive, setIsDragActive] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const fileReader = new FileReader();
    fileReader.onload = () => {
      setPreviewUrl(fileReader.result);
    };
    fileReader.readAsDataURL(file);
  }, [file]);

  const applyPickedFile = (pickedFile) => {
    if (!pickedFile) {
      return;
    }

    const fileIsValid = pickedFile.type.startsWith("image/");
    const validState = props.required ? fileIsValid : true;

    setFile(pickedFile);
    setIsValid(validState);
    props.onInput(props.id, pickedFile, validState);
  };

  const pickedHandler = (event) => {
    const pickedFile =
      event.target.files && event.target.files.length === 1
        ? event.target.files[0]
        : null;

    applyPickedFile(pickedFile);
    event.target.value = "";
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

    const droppedFiles = Array.from(event.dataTransfer.files || []);
    const pickedFile = droppedFiles.find((file) =>
      file.type.startsWith("image/"),
    );

    applyPickedFile(pickedFile);
  };

  return (
    <div className="form-control">
      <input
        id={props.id}
        ref={filePickerRef}
        style={{ display: "none" }}
        type="file"
        accept=".jpg,.png,.jpeg,.webp"
        onChange={pickedHandler}
      />

      <div className={`image-upload ${props.center ? "center" : ""}`}>
        <div
          className={`image-upload__dropzone ${isDragActive ? "image-upload__dropzone--active" : ""}`}
          onDragOver={dragOverHandler}
          onDragLeave={dragLeaveHandler}
          onDrop={dropHandler}
        >
          {previewUrl ? (
            <div className="image-upload__preview">
              <img src={previewUrl} alt="Preview" />
            </div>
          ) : (
            <p>Drag & drop an image here, or pick it from your device.</p>
          )}
        </div>

        <Button type="button" onClick={pickImageHandler}>
          PICK IMAGE
        </Button>
      </div>

      {!isValid && <p>{props.errorText}</p>}
    </div>
  );
};

export default ImageUpload;
