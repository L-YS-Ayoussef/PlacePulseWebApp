import { useState, useCallback, useEffect } from 'react';

let logoutTimer; // for automatically logout when the token expires 

export const useAuth = () => {
  const [token, setToken] = useState(false);
  const [tokenExpirationDate, setTokenExpirationDate] = useState();
  const [userId, setUserId] = useState(false);

  const login = useCallback((uid, token, expirationDate) => {
    setToken(token);
    setUserId(uid);

    // Storing the token in the local storage and handle the ecxpiration date   
    const tokenExpirationDate =
      expirationDate || new Date(new Date().getTime() + 1000 * 60 * 60); // the unit is in milli-seconds 
    setTokenExpirationDate(tokenExpirationDate);

    localStorage.setItem(
      'userData',
      JSON.stringify({
        userId: uid,
        token: token,
        expiration: tokenExpirationDate.toISOString() // [toISOString] -> is a kind of string for storing date information 
      })
    );
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setTokenExpirationDate(null);
    setUserId(null);
    localStorage.removeItem('userData');
  }, []);

  useEffect(() => { // in case the user refeshes the page, this hook will be executed, but in the beginning the condition will be false, then it will "clearTimeout", but when the other "useEffect" hook be executed and the user auto login, the condition will be true    
    if (token && tokenExpirationDate) {
      const remainingTime = tokenExpirationDate.getTime() - new Date().getTime();
      logoutTimer = setTimeout(logout, remainingTime);
    } else {
      clearTimeout(logoutTimer);
      // Notes on the "setTimeout" and "clearTimeout" --> 
      // When you call setTimeout multiple times, each call creates a new timer.The previous setTimeout calls are not automatically cleared.If you want to clear a previous timer, you need to use clearTimeout with the timer ID returned by setTimeout
      // Calling setTimeout multiple times without clearing previous timers will result in multiple timers running simultaneously.
    }
  }, [token, logout, tokenExpirationDate]);

  useEffect(() => {
    const storedData = JSON.parse(localStorage.getItem('userData')); // [JSON.parse] -> converting the json format to js object 
    if (
      storedData &&
      storedData.token &&
      new Date(storedData.expiration) > new Date()
    ) {
      login(storedData.userId, storedData.token, new Date(storedData.expiration));
    }
  }, [login]);

  return { token, login, logout, userId };
};

// For implementing the authentication --> 
  // 1) implement --> when logging in or signning up -> storing the token and its expiration date in the local storage 
  // 2) implement --> auto login that when the user refreshes the page it checks the token the expiration date and based on this check, it can call the function "login"
  // 3) implement --> auto logout when reaching the expiration date 




