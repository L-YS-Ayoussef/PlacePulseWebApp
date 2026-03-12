import React, {useState} from 'react';
import { Link } from 'react-router-dom';

import MainHeader from './MainHeader';
import NavLinks from './NavLinks';
import SideDrawer from './SideDrawer';
import Backdrop from '../UIElement/Backdrop';

import './MainNavigation.css';

const MainNavigation = props => {
  const [isDrawerOpen, setDrawerState] = useState(false);

  const handleBtnClick = () => {
    setDrawerState(true);
  };
  const closeDrawer = () => {
    setDrawerState(false);
  };

  return (
    <React.Fragment>
      {
        isDrawerOpen && <Backdrop onClick={closeDrawer} />
      }

      <SideDrawer show={isDrawerOpen} onClick={closeDrawer}>
          <nav className='main-navigation__drawer-nav'>
            <NavLinks />
          </nav>
      </SideDrawer>

      <MainHeader>
        <button className="main-navigation__menu-btn" onClick={handleBtnClick}>
          <span />
          <span style={{width: "2rem"}} /> 
          <span />
        </button>
        <h1 className="main-navigation__title">
          <Link to="/">PlacePulse</Link>
        </h1>
        <nav className='main-navigation__header-nav'>
          <NavLinks />
        </nav>
      </MainHeader>
    </React.Fragment>
  );
};


export default MainNavigation;
