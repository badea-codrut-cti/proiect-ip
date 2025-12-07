import React from 'react';

const HelloWorld = ({ name = 'World' }) => {
  return (
    <div className="hello-world">
      <h1>Hello {name}!</h1>
      <p>Welcome to React Testing</p>
    </div>
  );
};

export default HelloWorld;