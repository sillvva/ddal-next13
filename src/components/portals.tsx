"use client";

import { canUseDOM } from "$src/lib/utils";
import { createPortal } from "react-dom";
import { twMerge } from "tailwind-merge";
import { Markdown } from "./markdown";

export function PageLoader({ state }: { state: boolean }) {
	if (!canUseDOM()) return null;
	return createPortal(
		state && (
			<>
				<div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50" />
				<div className="fixed inset-0 z-50 flex items-center justify-center">
					<span className="loading loading-spinner w-16 text-secondary" />
				</div>
			</>
		),
		document.body
	);
}

type ModalState = {
	name: string;
	description: string;
	date?: Date;
};
export function Modal({ modal, closeModal }: { modal: ModalState | null; closeModal: () => void }) {
	if (!canUseDOM()) return null;
	return createPortal(
		modal && (
			<div className={twMerge("modal cursor-pointer", modal && "modal-open")} onClick={() => closeModal()}>
				<div className="modal-box relative cursor-default drop-shadow-lg" onClick={e => e.stopPropagation()}>
					<h3 className="cursor-text text-lg font-bold text-accent-content">{modal.name}</h3>
					{modal.date && <p className="text-xs">{modal.date.toLocaleString()}</p>}
					<Markdown className="cursor-text whitespace-pre-wrap pt-4 text-xs sm:text-sm">{modal.description}</Markdown>
				</div>
			</div>
		),
		document.body
	);
}
