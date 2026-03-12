import React, { useCallback, useEffect, useState } from "react";

import PlaceList from "../Components/PlaceList";
import Card from "../../Shared/Components/UIElement/Card";
import Button from "../../Shared/Components/FormElements/Button";
import ErrorModal from "../../Shared/Components/UIElement/ErrorModal";
import LoadingSpinner from "../../Shared/Components/UIElement/LoadingSpinner";
import { useHttpClient } from "../../Shared/hooks/http-hook";
import "./RecentPlaces.css";

const RecentPlaces = () => {
  const { isLoading, error, sendRequest, clearError } = useHttpClient();

  const [loadedPlaces, setLoadedPlaces] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [activeQuery, setActiveQuery] = useState("");

  const fetchPlaces = useCallback(async () => {
    try {
      const endpoint = activeQuery.trim()
        ? `http://localhost:5000/api/places/search/semantic?q=${encodeURIComponent(
            activeQuery.trim(),
          )}`
        : "http://localhost:5000/api/places";

      const responseData = await sendRequest(endpoint);
      setLoadedPlaces(responseData.places || []);
    } catch (err) {}
  }, [activeQuery, sendRequest]);

  useEffect(() => {
    fetchPlaces();
  }, [fetchPlaces]);

  const searchSubmitHandler = (event) => {
    event.preventDefault();
    setActiveQuery(searchText.trim());
  };

  const clearSearchHandler = () => {
    setSearchText("");
    setActiveQuery("");
  };

  return (
    <React.Fragment>
      <ErrorModal error={error} onClear={clearError} />

      <section className="recent-places-search">
        <Card className="recent-places-search__card">
          <div className="recent-places-search__header">
            <h1>{activeQuery ? "Semantic search results" : "Recent places"}</h1>
            <p>
              Describe the kind of place you want, and the app will suggest the
              closest matches.
            </p>
          </div>

          <form
            onSubmit={searchSubmitHandler}
            className="recent-places-search__form"
          >
            <textarea
              rows="3"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Example: A quiet café for studying with affordable prices and comfortable seating."
            />

            <div className="recent-places-search__actions">
              <Button type="submit" disabled={!searchText.trim()}>
                RECOMMEND
              </Button>

              {activeQuery && (
                <Button type="button" inverse onClick={clearSearchHandler}>
                  CLEAR
                </Button>
              )}
            </div>
          </form>

          {activeQuery && (
            <p className="recent-places-search__active-query">
              Searching for: <strong>{activeQuery}</strong>
            </p>
          )}
        </Card>
      </section>

      {isLoading ? (
        <div className="center">
          <LoadingSpinner />
        </div>
      ) : activeQuery && loadedPlaces.length === 0 ? (
        <div className="recent-places-search__empty">
          <Card>
            <h2>No close matches found.</h2>
            <p>Try a shorter or more general description.</p>
          </Card>
        </div>
      ) : (
        <PlaceList items={loadedPlaces} />
      )}
    </React.Fragment>
  );
};

export default RecentPlaces;
