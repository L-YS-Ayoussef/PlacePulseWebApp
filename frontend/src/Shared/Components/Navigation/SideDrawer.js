import React from 'react';
import ReactDOM from 'react-dom'; // note --> here ['react-dom'] not ['react-dom/client'] -> to use the method [createPortal]
import { CSSTransition } from "react-transition-group"; // this package to add animation to the component 

import './SideDrawer.css';

const SideDrawer = props => {
    const content =(
        <CSSTransition
            in={props.show}
            timeout={200}
            classNames="slide-in-left"
            mountOnEnter
            unmountOnExit
        >
            <aside className="side-drawer" onClick={props.onClick}>{props.children}</aside> 
        </CSSTransition>
    ); // as [JSX], you can assign an HTML element to a javascript variable
    return ReactDOM.createPortal(content, document.getElementById("drawer-hook")); // the method [createPortal] -> the first parameter is the [content(HTML elements)] representing [children] and the second one is the container(parent)
};

export default SideDrawer;

// Notes -->
//  1) React Portals --> are an advanced concept that allows developers to render their elements outside the React hierarchy tree without comprising the parent-child relationship between components
//  2) The component [CSSTransition] has attributes/properties -->
//      - [in] --> the component will be shown when the value of this attribue is true
//      - [classNames] --> this third party library knows how to use this special classes of "slide-in-left" in sequence, these classes are in the [index.css] file
//      - [mountOnEnter & unmountOnExit] --> telling when the element [aside] should be removed or added
//  3) In JSX, you should not use a semicolon at the end of the opening or closing tag.








