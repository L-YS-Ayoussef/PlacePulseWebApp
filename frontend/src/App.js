import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; // the package [react-router-dom] to handle the routes of the different SPAs of the web app

import Users from "./User/Pages/User";
import NewPlace from './Places/Pages/NewPlaces';
import UpdatePlace from './Places/Pages/UpdatePlace';
import UserPlaces from "./Places/Pages/UserPlaces";
import MainNavigation from "./Shared/Components/Navigation/MainNavigation";
import NotFound from './Notfound';
import Auth from './User/Pages/Auth';

import { AuthContext } from './Shared/context/auth-context';
import { useAuth } from './Shared/hooks/auth-hook';

const App = () => {
  const { token, login, logout, userId } = useAuth();

  let routes;
  if (token){
    routes = (
      <Routes>
        <Route path="/" element={<Users />} />
        <Route path='/:userId/places' element={<UserPlaces />} />
        <Route path="/places/new" element={<NewPlace />} />
        <Route path="/places/:placeId" element={<UpdatePlace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    );
  }else{
    routes = (
      <Routes>
        <Route path="/" element={<Users />} />
        <Route path='/:userId/places' element={<UserPlaces />} />
        <Route path="/auth" element={<Auth />}></Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    );
  }


  return (
    <AuthContext.Provider value={{ isLoggedIn: !!token, token: token, userId: userId, login: login, logout: logout }}>
      <Router>
        <MainNavigation />
        <main>
          {routes}
        </main>
      </Router>
    </AuthContext.Provider>
    
  );
}

// Notes --> 
//  1) [<Route path="/" element={<Users />} exact />] --> when the route is "/" render what inside the component [Route], [exact] --> by default it is true meaning that only on this path render this page
//  2) inside the component [Routes], the compiler will render a page according to the route taking precedence over
//  3) using the main tag <main> to put the content of the page, htis main has a cs property -> [margin-top: 5rem] to make distance between the header














export default App;
