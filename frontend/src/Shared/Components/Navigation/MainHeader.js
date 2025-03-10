import React from 'react';

import './MainHeader.css';

const MainHeader = props => {
  return <header className="main-header">{props.children}</header>; // {props.children} --> refers to the HTML elements passed between the opening and closing tags of the component
};

export default MainHeader;
