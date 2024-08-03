import React from 'react';

function UserProfile({ userData }) {
  return (
    <div className="UserProfile">
      <h2>{userData.name}</h2>
      <img src={userData.avatar_url} alt="User Avatar" />
      <p>Public Repos: {userData.public_repos}</p>
      <p>Followers: {userData.followers}</p>
      <p>Following: {userData.following}</p>
    </div>
  );
}

export default UserProfile;
