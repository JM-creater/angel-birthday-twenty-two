import React, { useEffect, useRef } from 'react';
import {
  Heart,
  BookOpen,
  X,
  Cake
} from 'lucide-react';
import { DEFAULT_LETTER_CONTENT } from '../data/angelData';
import { soundManager } from '../utils/soundEffects';

interface LoveLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToCake: () => void;
}

export const LoveLetterModal: React.FC<LoveLetterModalProps> = ({
  isOpen,
  onClose,
  onGoToCake
}) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const letter = DEFAULT_LETTER_CONTENT;

  // Sync dialog open/close with native <dialog closedby="any"> + fallback
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  // Fallback for browsers without native closedby="any" support
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleNativeClose = () => {
      onClose();
    };
    dialog.addEventListener('close', handleNativeClose);

    const handleBackdropClick = (event: MouseEvent) => {
      if ('closedBy' in HTMLDialogElement.prototype) return;
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const isDialogContent =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;

      if (!isDialogContent) {
        dialog.close();
      }
    };

    dialog.addEventListener('click', handleBackdropClick);
    return () => {
      dialog.removeEventListener('close', handleNativeClose);
      dialog.removeEventListener('click', handleBackdropClick);
    };
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      closedby="any"
      aria-labelledby="letterDialogTitle"
      className="love-letter-dialog"
    >
      <div className="letter-modal-card">
        {/* Top Decorative Header */}
        <div className="letter-modal-topbar">
          <div className="letter-tabs">
            <span className="letter-tab-btn active">
              <BookOpen size={15} />
              <span>22nd Birthday Letter</span>
            </span>
          </div>

          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close letter"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="letter-modal-body">
          <div className="parchment-paper">
            {/* Wax Seal Emblem */}
            <div className="wax-seal-header">
              <div className="wax-seal-badge">
                <span>22</span>
                <Heart size={12} fill="currentColor" />
              </div>
              <span className="recipient-kicker">{letter.recipientTitle}</span>
            </div>

            <h2 id="letterDialogTitle" className="letter-greeting">
              {letter.greeting}
            </h2>

            <div className="letter-paragraphs">
              {letter.paragraphs.map((p, idx) => (
                <p key={idx} className="letter-paragraph">
                  {p}
                </p>
              ))}
            </div>

            {/* Handwritten Closing & Signature */}
            <div className="letter-signature-block">
              <p className="letter-closing">{letter.closing}</p>
              <p className="letter-signature">{letter.signature}</p>
            </div>

            <div className="letter-footer-actions">
              <button
                type="button"
                className="btn-Action-Gold"
                onClick={() => {
                  soundManager.playHeartChime(4);
                  onGoToCake();
                }}
              >
                <Cake size={16} />
                <span>Make Your 22nd Birthday Wish 🎂</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
};
