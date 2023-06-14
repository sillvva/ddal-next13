"use client";

import { newCharacterSchema } from "$src/types/zod-schema";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { twMerge } from "tailwind-merge";
import { z } from "zod";

import { zodResolver } from "@hookform/resolvers/zod";

import type { CharacterData } from "$src/server/db/characters";
import type { SaveCharacterFunction } from "$src/server/actions/character";

export function EditCharacterForm({
	id,
	character,
	editCharacter
}: {
	id: string;
	character: z.infer<typeof newCharacterSchema>;
	editCharacter: (data: z.infer<typeof newCharacterSchema>) => ReturnType<SaveCharacterFunction>;
}) {
	const [isPending, startTransition] = useTransition();
	const [saving, setSaving] = useState(false);
	const {
		register,
		formState: { errors },
		handleSubmit
	} = useForm<z.infer<typeof newCharacterSchema>>({
		resolver: zodResolver(newCharacterSchema)
	});

	const submitHandler = handleSubmit(data => {
		setSaving(true);
		startTransition(async () => {
			const result = await editCharacter(data);
			if (result.error) {
				alert(result.error);
			}
		});
	});

	useEffect(() => {
		if (!isPending && saving) {
			setTimeout(() => setSaving(false), 1000);
		}
	}, [saving, isPending]);

	return (
		<form onSubmit={submitHandler}>
			<div className="flex flex-wrap">
				<div className="basis-full px-2 sm:basis-1/2">
					<div className="form-control w-full">
						<label className="label">
							<span className="label-text">
								Character Name
								<span className="text-error">*</span>
							</span>
						</label>
						<input
							type="text"
							{...register("name", { required: true, value: character.name, disabled: saving })}
							className="input-bordered input w-full focus:border-primary"
						/>
						<label className="label">
							<span className="label-text-alt text-error">{errors.name?.message}</span>
						</label>
					</div>
				</div>
				<div className="basis-full px-2 sm:basis-1/2">
					<div className="form-control w-full">
						<label className="label">
							<span className="label-text">
								Campaign
								<span className="text-error">*</span>
							</span>
						</label>
						<input
							type="text"
							{...register("campaign", { required: true, value: character.campaign || "", disabled: saving })}
							className="input-bordered input w-full focus:border-primary"
						/>
						<label className="label">
							<span className="label-text-alt text-error">{errors.campaign?.message}</span>
						</label>
					</div>
				</div>
				<div className="basis-full px-2 sm:basis-1/2">
					<div className="form-control w-full">
						<label className="label">
							<span className="label-text">Race</span>
						</label>
						<input
							type="text"
							{...register("race", { value: character.race || "", disabled: saving })}
							className="input-bordered input w-full focus:border-primary"
						/>
						<label className="label">
							<span className="label-text-alt text-error">{errors.race?.message}</span>
						</label>
					</div>
				</div>
				<div className="basis-full px-2 sm:basis-1/2">
					<div className="form-control w-full">
						<label className="label">
							<span className="label-text">Class</span>
						</label>
						<input
							type="text"
							{...register("class", { value: character.class || "", disabled: saving })}
							className="input-bordered input w-full focus:border-primary"
						/>
						<label className="label">
							<span className="label-text-alt text-error">{errors.class?.message}</span>
						</label>
					</div>
				</div>
				<div className="basis-full px-2">
					<div className="form-control w-full">
						<label className="label">
							<span className="label-text">Character Sheet URL</span>
						</label>
						<input
							type="text"
							{...register("character_sheet_url", { value: character.character_sheet_url || "", disabled: saving })}
							className="input-bordered input w-full focus:border-primary"
						/>
						<label className="label">
							<span className="label-text-alt text-error">{errors.character_sheet_url?.message}</span>
						</label>
					</div>
				</div>
				<div className="basis-full px-2">
					<div className="form-control w-full">
						<label className="label">
							<span className="label-text">Image URL</span>
						</label>
						<input
							type="text"
							{...register("image_url", { value: character.image_url || "", disabled: saving })}
							className="input-bordered input w-full focus:border-primary"
						/>
						<label className="label">
							<span className="label-text-alt text-error">{errors.image_url?.message}</span>
						</label>
					</div>
				</div>
				<div className="m-4 basis-full text-center">
					<button type="submit" className={twMerge("btn-primary btn", saving && "loading")} disabled={saving}>
						{id === "new" ? "Save" : "Update"}
					</button>
				</div>
			</div>
		</form>
	);
}
