import { useState, useCallback, useRef, useEffect } from 'react';

export const useHttpClient = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState();

  const activeHttpRequests = useRef([]); // useRef Hook --> [activeHttpRequests]: This ref is used to keep track of active HTTP requests that might be aborted.

  const sendRequest = useCallback( // useCallback Hook --> [sendRequest]: This is the main function that performs the HTTP request.It is wrapped in a useCallback hook to ensure it is memoized and does not get recreated on every render.
    async (url, method = 'GET', body = null, headers = {}) => {
      setIsLoading(true);
      const httpAbortCtrl = new AbortController(); // httpAbortCtrl is created as an instance of AbortController, which allows you to abort the request if needed.
      activeHttpRequests.current.push(httpAbortCtrl);

      try {
        const response = await fetch(url, {
          method,
          body,
          headers,
          signal: httpAbortCtrl.signal // The signal option is passed the AbortController's signal, which allows the request to be aborted if necessary.
        });

        const responseData = await response.json();

        activeHttpRequests.current = activeHttpRequests.current.filter(
          reqCtrl => reqCtrl !== httpAbortCtrl
        ); // filtering out the httpAbortCtrl from the activeHttpRequests.current array once the request associated with it completes. 

        if (!response.ok) {
          throw new Error(responseData.message);
        }

        setIsLoading(false);
        return responseData;
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
        throw err;
      }
    },
    []
  );

  const clearError = () => {
    setError(null);
  };

  useEffect(() => { // The useEffect hook is used to clean up active HTTP requests when the component using this hook unmounts.This ensures no memory leaks or unwanted requests continue after the component is no longer in use.
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      activeHttpRequests.current.forEach(abortCtrl => abortCtrl.abort());
    };
  }, []);

  return { isLoading, error, sendRequest, clearError };
};

// Notes on the custom HTTP Hook --> The custom hook useHttpClient is designed to handle HTTP requests in a React component.It manages loading state, error state, and the ability to cancel ongoing requests. 
// The importance of aborting useless requests --> 
  // Memory management: Keeping track of only active requests prevents memory leaks by removing completed requests.
  // Prevent side effects: When a component unmounts, ongoing requests could potentially try to update state on an unmounted component, leading to memory leaks or errors.Aborting these requests prevents such issues.
  // Resource management: Cancelling unnecessary or outdated requests conserves network and system resources.
