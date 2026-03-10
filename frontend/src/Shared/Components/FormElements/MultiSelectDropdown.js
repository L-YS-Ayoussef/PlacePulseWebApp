import React, { useEffect, useRef, useState } from "react";
import "./MultiSelectDropdown.css";

const MultiSelectDropdown = ({ label, options, selectedValues, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef();

  useEffect(() => {
    const closeHandler = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", closeHandler);

    return () => {
      document.removeEventListener("mousedown", closeHandler);
    };
  }, []);

  const toggleOption = (option) => {
    if (selectedValues.includes(option)) {
      onChange(selectedValues.filter((item) => item !== option));
      return;
    }

    onChange([...selectedValues, option]);
  };

  return (
    <div className="multi-select-dropdown" ref={wrapperRef}>
      <label>{label}</label>
      <button
        type="button"
        className="multi-select-dropdown__trigger"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {selectedValues.length > 0
          ? `${selectedValues.length} tag${selectedValues.length > 1 ? "s" : ""} selected`
          : "Select tags"}
      </button>

      {isOpen && (
        <div className="multi-select-dropdown__menu">
          {options.map((option) => (
            <label key={option} className="multi-select-dropdown__option">
              <input
                type="checkbox"
                checked={selectedValues.includes(option)}
                onChange={() => toggleOption(option)}
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      )}

      {selectedValues.length > 0 && (
        <div className="multi-select-dropdown__chips">
          {selectedValues.map((tag) => (
            <span key={tag} className="multi-select-dropdown__chip">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;
