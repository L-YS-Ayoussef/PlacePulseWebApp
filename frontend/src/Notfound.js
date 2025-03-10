import React, { useEffect } from "react";
import {useNavigate } from 'react-router-dom'; 

const NotFound = () => {
    const navigate = useNavigate();

    // Redirect to the home page after 3 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            navigate('/');
        }, 3000);

        return () => clearTimeout(timer);
    }, [navigate]);

    return <h1>404 - Not Found</h1>;
};

export default NotFound;