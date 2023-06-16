"use client";
import { useEffect, useState, useTransition } from "react";
import { PageLoader } from "./portals";

import type { DeleteCharacterResult } from "$src/server/actions/character";
import type { DeleteDMResult } from "$src/server/actions/dm";

export function DeleteCharacter({ characterId, deleteCharacter }: { characterId: string; deleteCharacter: (characterId: string) => DeleteCharacterResult }) {
	const [isPending, startTransition] = useTransition();
	const [deleting, setDeleting] = useState(false);

	useEffect(() => {
		if (!isPending && deleting) {
			setTimeout(() => setDeleting(false), 5000);
		}
	}, [deleting, isPending]);

	return (
		<>
			<a
				className="bg-red-600 text-white hover:bg-red-900"
				onClick={() => {
					if (confirm("Are you sure you want to delete this character? This action cannot be undone.")) {
						setDeleting(true);
						startTransition(async () => {
							const result = await deleteCharacter(characterId);
							if (result.error) {
								alert(result.error);
								setDeleting(false);
							}
						});
					}
				}}>
				Delete
			</a>
			<PageLoader state={deleting} />
		</>
	);
}

export function DeleteDM({ dmId, deleteDM }: { dmId: string; deleteDM: (dmId: string) => DeleteDMResult }) {
	const [isPending, startTransition] = useTransition();
	const [deleting, setDeleting] = useState(false);

	useEffect(() => {
		if (!isPending && deleting) {
			setTimeout(() => setDeleting(false), 5000);
		}
	}, [deleting, isPending]);

	return (
		<>
			<a
				className="btn-sm btn bg-red-600 text-white hover:bg-red-900"
				onClick={() => {
					if (confirm("Are you sure you want to delete this DM? This action cannot be undone.")) {
						setDeleting(true);
						startTransition(async () => {
							const result = await deleteDM(dmId);
							if (result.error) {
								alert(result.error);
								setDeleting(false);
							}
						});
					}
				}}>
				Delete
			</a>
			<PageLoader state={deleting} />
		</>
	);
}
