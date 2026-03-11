import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import RecentPlaces from "./Places/Pages/RecentPlaces";
import NewPlace from "./Places/Pages/NewPlaces";
import UpdatePlace from "./Places/Pages/UpdatePlace";
import UserPlaces from "./Places/Pages/UserPlaces";
import PlaceDetails from "./Reviews/Pages/PlaceDetails";
import SharedCollection from "./Collections/Pages/SharedCollection";
import MainNavigation from "./Shared/Components/Navigation/MainNavigation";
import NotFound from "./Notfound";
import Auth from "./User/Pages/Auth";
import UserCollection from "./Collections/Pages/UserCollection";

import { AuthContext } from "./Shared/context/auth-context";
import { useAuth } from "./Shared/hooks/auth-hook";

const App = () => {
  const { token, login, logout, userId } = useAuth();

  let routes;

  if (token) {
    routes = (
      <Routes>
        <Route path="/" element={<RecentPlaces />} />
        <Route path="/:userId/places" element={<UserPlaces />} />
        <Route path="/places/new" element={<NewPlace />} />
        <Route path="/places/:placeId" element={<UpdatePlace />} />
        <Route path="/places/:placeId/details" element={<PlaceDetails />} />
        <Route
          path="/collections/shared/:shareToken"
          element={<SharedCollection />}
        />
        <Route path="/collections/:collectionId" element={<UserCollection />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    );
  } else {
    routes = (
      <Routes>
        <Route path="/" element={<RecentPlaces />} />
        <Route path="/:userId/places" element={<UserPlaces />} />
        <Route path="/places/:placeId/details" element={<PlaceDetails />} />
        <Route
          path="/collections/shared/:shareToken"
          element={<SharedCollection />}
        />
        <Route path="/auth" element={<Auth />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn: !!token,
        token: token,
        userId: userId,
        login: login,
        logout: logout,
      }}
    >
      <Router>
        <MainNavigation />
        <main>{routes}</main>
      </Router>
    </AuthContext.Provider>
  );
};

export default App;
