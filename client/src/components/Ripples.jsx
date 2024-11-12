import React from "react";
import "../index.css";

const Ripples = ({ children }) => {
  return (
    <div className="sonar-container">
      {/* Repeating ripple effect */}
      <div className="sonar-element-wrapper">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="ripple"
            style={{ animationDelay: `${i * 0.5}s` }}
          />
        ))}

        {/* Children will be centered in the ripple effect */}
        <div className="sonar-content">{children}</div>
      </div>
    </div>
  );
};

export default Ripples;
