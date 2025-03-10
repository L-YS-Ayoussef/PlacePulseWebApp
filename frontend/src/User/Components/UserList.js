import React from 'react';

import UserItem from './UserItem';
import Card from '../../Shared/Components/UIElement/Card';
import './UserList.css';

const UserList = props => {
    if (props.items.length === 0) {
        return (
            <Card className="center"> 
                <h2>No users found.</h2>
            </Card>
        );
    }

    return (
        <ul className="users-list">
            {props.items.map(user => (
                <UserItem
                    key={user.id}
                    id={user.id}
                    image={user.image}
                    name={user.name}
                    placeCount={user.places.length}
                />
            ))}
        </ul>
    );
};

export default UserList;





