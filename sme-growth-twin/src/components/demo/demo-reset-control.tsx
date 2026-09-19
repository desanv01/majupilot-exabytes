"use client";

import { useId, useRef } from "react";

type DemoResetControlProps = {
  compact?: boolean;
  recordsPresent?: boolean;
  onConfirm: () => void;
};

export function DemoResetControl({
  compact = false,
  recordsPresent = true,
  onConfirm,
}: DemoResetControlProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  const open = () => dialogRef.current?.showModal();
  const close = () => dialogRef.current?.close();
  const confirm = () => {
    onConfirm();
    close();
  };

  return (
    <>
      <button
        className={compact ? "demo-banner-reset" : "reset-demo"}
        type="button"
        onClick={open}
      >
        Reset demo data
      </button>
      <dialog
        className="demo-reset-dialog"
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onCancel={close}
      >
        <div className="demo-reset-dialog-body">
          <p className="eyebrow">Scoped reset</p>
          <h2 id={titleId}>{recordsPresent ? "Reset this demonstration?" : "Confirm a clean demo state?"}</h2>
          <p id={descriptionId}>
            {recordsPresent
              ? "This removes only known SME Growth Twin prototype records saved in this browser. Other browser storage stays unchanged."
              : "No known SME Growth Twin records were found. Confirming leaves unrelated browser storage unchanged."}
          </p>
          <div className="demo-reset-dialog-actions">
            <button className="button secondary" type="button" onClick={close}>
              Cancel
            </button>
            <button className="button danger" type="button" onClick={confirm}>
              Reset known records
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
