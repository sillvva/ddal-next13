"use client";
import { useEffect, useState, useTransition } from "react";

import { PageLoader } from "./portals";

import type { DeleteCharacterFunction } from "$src/server/actions/character";
export function DeleteCharacter({ characterId, deleteCharacter }: { characterId: string; deleteCharacter: DeleteCharacterFunction }) {
	const [isPending, startTransition] = useTransition();
	const [deleting, setDeleting] = useState(false);

	useEffect(() => {
		if (!isPending && deleting) {
			setTimeout(() => setDeleting(false), 1000);
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