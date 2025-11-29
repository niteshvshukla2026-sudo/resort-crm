import React from 'react';
import './modal.css';

const Modal = ({ title, children, onClose }) => {
  return (
    <div className="sa-modal-backdrop" onClick={onClose}>
      <div className="sa-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sa-modal-header">
          <h3>{title}</h3>
          <button className="sa-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="sa-modal-body">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
