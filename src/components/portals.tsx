"use client";

import { canUseDOM } from "$src/lib/misc";
import { createPortal } from "react-dom";

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
