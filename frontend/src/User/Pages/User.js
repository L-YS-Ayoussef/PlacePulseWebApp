import React, { useState, useEffect } from "react";

import UserList from "../Components/UserList";
import ErrorModal from "../../Shared/Components/UIElement/ErrorModal";
import LoadingSpinner from "../../Shared/Components/UIElement/LoadingSpinner";

import { useHttpClient } from "../../Shared/hooks/http-hook";

const Users = () => {
    const { isLoading, error, sendRequest, clearError } = useHttpClient();
    const [loadedUsers, setLoadedUsers] = useState();

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const responseData = await sendRequest(
                    'http://localhost:5000/api/users'
                );

                setLoadedUsers(responseData.users);
            } catch (err) { }
        };
        fetchUsers();
    }, [sendRequest]);

    return (
        <>
            <ErrorModal error={error} onClear={clearError} />
            {isLoading && (
                <div className="center">
                    <LoadingSpinner />
                </div>
            )}
            {!isLoading && loadedUsers && <UserList items={loadedUsers} />}
        </>
    );
};

export default Users;