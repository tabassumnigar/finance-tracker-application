import React, { PropsWithChildren } from 'react';
import './modal.css';

type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
};

export default function Modal({ open, title, onClose, children }: PropsWithChildren<ModalProps>) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <header className="modal-header">
          <h3>{title}</h3>
          <button type="button" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
