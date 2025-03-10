import React, {useContext} from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

import { AuthContext } from '../../context/auth-context';
import './NavLinks.css';

const NavLinks = props => {
    const auth = useContext(AuthContext);
    const navigate = useNavigate();

    return <ul className="nav-links">
        <li>
            <NavLink to="/" exact>ALL USERS</NavLink>
        </li>
        {auth.isLoggedIn && (
            <li>
                <NavLink to={`/${auth.userId}/places`}>MY PLACES</NavLink>
            </li>
        )}
        
        {auth.isLoggedIn && (
            <li>
                <NavLink to="/places/new">ADD PLACE</NavLink>
            </li>
        )}

        {!auth.isLoggedIn && (
            <li>
                <NavLink to="/auth">AUTHENTICATE</NavLink>
            </li>
        )}

        {auth.isLoggedIn && (
            <li>
                <button onClick={() => { auth.logout(); navigate("/"); }}>LOGOUT</button>
            </li>
        )}
    </ul>
};

export default NavLinks;

// Note -> [exact] -> prop is used to ensure that the route matches exactly with the specified path and does not partially match other paths. It's commonly used when defining routes to prevent multiple routes from being matched simultaneously