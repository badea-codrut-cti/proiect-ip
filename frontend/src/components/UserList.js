import React, { useState } from 'react';

const UserList = ({ users = [], onUserSelect }) => {
  const [selectedUser, setSelectedUser] = useState(null);

  const handleUserClick = (user) => {
    setSelectedUser(user);
    if (onUserSelect) {
      onUserSelect(user);
    }
  };

  return (
    <div className="user-list">
      <h2>Users</h2>
      {users.length === 0 ? (
        <p>No users found</p>
      ) : (
        <ul>
          {users.map(user => (
            <li 
              key={user.id} 
              onClick={() => handleUserClick(user)}
              className={selectedUser?.id === user.id ? 'selected' : ''}
              data-testid={`user-${user.id}`}
            >
              {user.name} - {user.email}
            </li>
          ))}
        </ul>
      )}
      {selectedUser && (
        <div className="selected-user" data-testid="selected-user">
          Selected: {selectedUser.name}
        </div>
      )}
    </div>
  );
};

export default UserList;