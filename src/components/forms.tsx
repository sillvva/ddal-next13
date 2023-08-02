"use client";

import { getMagicItems, getStoryAwards } from "$src/lib/entities";
import { formatDate } from "$src/lib/utils";
import { dungeonMasterSchema, logSchema, newCharacterSchema, valibotResolver } from "$src/types/schemas";
import { useEffect, useMemo, useState, useTransition } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { twMerge } from "tailwind-merge";
import { flatten, safeParse } from "valibot";
import { mdiAlertCircle, mdiTrashCan } from "@mdi/js";
import Icon from "@mdi/react";
import AutoFillSelect from "./autofill";
import AutoResizeTextArea from "./textarea";

import type { DungeonMasterSchema, LogSchema, NewCharacterSchema } from "$src/types/schemas";
import type { DungeonMaster, LogType } from "@prisma/client";
import type { SaveCharacterResult } from "$src/server/actions/character";
import type { SaveLogResult } from "$src/server/actions/log";
import type { SaveDMResult } from "$src/server/actions/dm";
import type { CharacterData, CharactersData } from "$src/server/db/characters";
import type { LogData } from "$src/server/db/log";
import type { UserDMWithLogs } from "$src/server/db/dms";
export function EditCharacterForm({
	id,
	character,
	editCharacter
}: {
	id: string;
	character: NewCharacterSchema;
	editCharacter: (data: NewCharacterSchema) => SaveCharacterResult;
}) {
	const [isPending, startTransition] = useTransition();
	const [saving, setSaving] = useState(false);
	const {
		register,
		formState: { errors },
		handleSubmit
	} = useForm<NewCharacterSchema>({
		resolver: valibotResolver(newCharacterSchema)
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

export function EditCharacterLogForm({
	id,
	log,
	dms,
	character,
	saveLog
}: {
	id: string;
	log?: CharacterData["logs"][0];
	dms: DungeonMaster[];
	character: CharacterData;
	saveLog: (data: LogSchema) => SaveLogResult;
}) {
	const [isPending, startTransition] = useTransition();
	const [saving, setSaving] = useState(false);
	const form = useForm<LogSchema>({
		resolver: valibotResolver(logSchema)
	});

	const selectedLog = useMemo(
		() =>
			log || {
				saving: true,
				characterId: character.id,
				id: "",
				name: "",
				description: "",
				date: new Date(),
				type: "game" as LogType,
				created_at: new Date(),
				experience: 0,
				acp: 0,
				tcp: 0,
				level: 0,
				gold: 0,
				dtd: 0,
				dungeonMasterId: "",
				dm: {
					id: "",
					name: "",
					DCI: null,
					uid: ""
				},
				applied_date: new Date(),
				is_dm_log: false,
				magic_items_gained: [],
				magic_items_lost: [],
				story_awards_gained: [],
				story_awards_lost: []
			},
		[log, character.id]
	);

	const [date, setDate] = useState(selectedLog.date);
	const [season, setSeason] = useState<1 | 8 | 9>(selectedLog.experience ? 1 : selectedLog.acp ? 8 : 9);
	const [type, setType] = useState<LogType>(selectedLog.type || "game");
	const [magicItemsGained, setMagicItemsGained] = useState(
		selectedLog.magic_items_gained.map(mi => ({ id: mi.id, name: mi.name, description: mi.description || "" }))
	);
	const [magicItemsLost, setMagicItemsLost] = useState<string[]>(selectedLog.magic_items_lost.map(mi => mi.id));
	const [storyAwardsGained, setStoryAwardsGained] = useState(
		(selectedLog.story_awards_gained || []).map(mi => ({ id: mi.id, name: mi.name, description: mi.description || "" }))
	);
	const [storyAwardsLost, setStoryAwardsLost] = useState<string[]>(selectedLog.story_awards_lost.map(mi => mi.id));
	const [mutError, setMutError] = useState<string | null>(null);

	const magicItems = character
		? getMagicItems(character, { excludeDropped: true, lastLogId: id === "new" ? "" : id }).sort((a, b) => a.name.localeCompare(b.name))
		: [];
	const storyAwards = character
		? getStoryAwards(character, { excludeDropped: true, lastLogId: id === "new" ? "" : id }).sort((a, b) => a.name.localeCompare(b.name))
		: [];
	const addMagicItem = () => setMagicItemsGained([...magicItemsGained, { id: "", name: "", description: "" }]);
	const removeMagicItem = (index: number) => setMagicItemsGained(magicItemsGained.filter((_, i) => i !== index));
	const addLostMagicItem = () => setMagicItemsLost([...magicItemsLost, magicItems[0]?.id || ""]);
	const removeLostMagicItem = (index: number) => setMagicItemsLost(magicItemsLost.filter((_, i) => i !== index));

	const addStoryAward = () => setStoryAwardsGained([...storyAwardsGained, { id: "", name: "", description: "" }]);
	const removeStoryAward = (index: number) => setStoryAwardsGained(storyAwardsGained.filter((_, i) => i !== index));
	const addLostStoryAward = () => setStoryAwardsLost([...storyAwardsLost, storyAwards[0]?.id || ""]);
	const removeLostStoryAward = (index: number) => setStoryAwardsLost(storyAwardsLost.filter((_, i) => i !== index));

	const setDM = (dm?: DungeonMaster) => {
		form.setValue("dm.id", dm?.id || "");
		form.setValue("dm.name", dm?.name || "");
		form.setValue("dm.DCI", dm?.DCI || null);
	};

	const submitHandler = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		const activeName = document.activeElement?.getAttribute("name");
		if (activeName === "dm.name" && !form.getValues("dm.name")) return;
		if (activeName === "dm.DCI" && !form.getValues("dm.DCI")) return;

		const acp = form.getValues("acp");
		if (character.total_level == 20 && acp - selectedLog.acp > 0) {
			form.setError("acp", { message: "ACP cannot be gained at level 20." });
			return;
		}
		const level = form.getValues("level") * 1;
		if (character.total_level + level - selectedLog.level > 20 && level > 0) {
			form.setError("level", { message: "Character cannot exceed level 20." });
			return;
		}

		form.handleSubmit(onSubmit)(e);
	};

	const onSubmit: SubmitHandler<LogSchema> = e => {
		form.clearErrors();

		const values = form.getValues();
		values.type = type;
		values.magic_items_gained = magicItemsGained;
		values.magic_items_lost = magicItemsLost;
		values.story_awards_gained = storyAwardsGained;
		values.story_awards_lost = storyAwardsLost;

		if (!selectedLog.id) values.date = date.toISOString();

		const parsedResult = safeParse(logSchema, values);
		if (parsedResult.success) {
			setSaving(true);
			startTransition(async () => {
				const result = await saveLog(parsedResult.data);
				if (result.error) {
					setMutError(result.error);
					setSaving(false);
				}
			});
		} else {
			const flatErrors = flatten(parsedResult.error);
			for (const field in flatErrors.nested) {
				const fieldName = field as (typeof issueFields)[number];
				const message = flatErrors.nested[field]?.join(", ");
				const issueFields = ["date", "name", "dm.name", "description", "characterId", "experience", "acp", "tcp", "level", "gold"] as const;
				if (issueFields.find(i => i == field)) {
					form.setError(fieldName, { message });
				}
				if (field.match(/magic_items_gained\.\d+\.name/)) {
					form.setError(fieldName, { message });
				}
				if (field.match(/story_awards_gained\.\d+\.name/)) {
					form.setError(fieldName, { message });
				}
			}
		}
	};

	useEffect(() => {
		if (!isPending && saving) {
			setTimeout(() => setSaving(false), 2000);
		}
	}, [saving, isPending]);

	useEffect(() => {
		if (!selectedLog.id) {
			setDate(new Date());
		}
	}, [selectedLog]);

	if (id !== "new" && !selectedLog.name) {
		return <></>;
	}

	return (
		<>
			{mutError && (
				<div className="alert alert-error shadow-lg">
					<div>
						<Icon path={mdiAlertCircle} size={1} />
						<span>{mutError}</span>
					</div>
				</div>
			)}

			<form onSubmit={submitHandler}>
				<input type="hidden" {...form.register("characterId", { value: character.id })} />
				<input type="hidden" {...form.register("id", { value: id === "new" ? "" : id })} />
				<input type="hidden" {...form.register("is_dm_log", { value: selectedLog.is_dm_log })} />
				<div className="grid grid-cols-12 gap-4">
					{!selectedLog.is_dm_log && (
						<div className="form-control col-span-12 sm:col-span-4">
							<label className="label">
								<span className="label-text">Log Type</span>
							</label>
							<select value={type} onChange={e => setType(e.target.value as LogType)} disabled={saving} className="select-bordered select w-full">
								<option value={"game"}>Game</option>
								<option value={"nongame"}>Non-Game (Purchase, Trade, etc)</option>
							</select>
						</div>
					)}
					<div className={twMerge("form-control col-span-12", selectedLog.is_dm_log ? "sm:col-span-6" : "sm:col-span-4")}>
						<label className="label">
							<span className="label-text">
								Title
								<span className="text-error">*</span>
							</span>
						</label>
						<input
							type="text"
							{...form.register("name", { required: true, value: selectedLog.name, disabled: saving })}
							className="input-bordered input w-full focus:border-primary"
							aria-invalid={form.formState.errors.name ? "true" : "false"}
						/>
						<label className="label">
							<span className="label-text-alt text-error">{form.formState.errors.name?.message}</span>
						</label>
					</div>
					<div className={twMerge("form-control col-span-12", selectedLog.is_dm_log ? "sm:col-span-6" : "sm:col-span-4")}>
						<label className="label">
							<span className="label-text">
								Date
								<span className="text-error">*</span>
							</span>
						</label>
						<input
							type="datetime-local"
							{...form.register("date", {
								required: true,
								value: formatDate(date),
								disabled: saving,
								setValueAs: (v: string) => new Date(v || formatDate(date)).toISOString()
							})}
							className="input-bordered input w-full focus:border-primary"
							aria-invalid={form.formState.errors.date ? "true" : "false"}
						/>
						<label className="label">
							<span className="label-text-alt text-error">{form.formState.errors.date?.message}</span>
						</label>
					</div>
					<div className="col-span-12 grid grid-cols-12 gap-4">
						{type === "game" && (
							<>
								<input type="hidden" {...form.register("dm.id", { value: selectedLog.dm?.id || "" })} />
								{selectedLog.is_dm_log ? (
									<>
										<input type="hidden" {...form.register("dm.name", { value: selectedLog.dm?.name || "" })} />
										<input type="hidden" {...form.register("dm.DCI", { value: selectedLog.dm?.DCI || "" })} />
										<input type="hidden" {...form.register("dm.uid", { value: selectedLog.dm?.uid || "" })} />
									</>
								) : (
									<>
										<div className="form-control col-span-12 sm:col-span-6">
											<label className="label">
												<span className="label-text">DM Name</span>
											</label>
											<AutoFillSelect
												type="text"
												inputProps={form.register("dm.name", {
													value: selectedLog.dm?.name || "",
													disabled: saving
												})}
												values={dms?.map(dm => ({ key: dm.name, value: dm.name + (dm.DCI ? ` (${dm.DCI})` : "") })) || []}
												onSelect={val => {
													setDM(dms?.find(dm => dm.name === val));
												}}
											/>
											<label className="label">
												<span className="label-text-alt text-error">{form.formState.errors.dm?.name?.message}</span>
											</label>
										</div>
										<div className="form-control col-span-12 sm:col-span-6">
											<label className="label">
												<span className="label-text">DM DCI</span>
											</label>
											<AutoFillSelect
												type="number"
												inputProps={form.register("dm.DCI", {
													value: selectedLog.dm?.DCI || null,
													disabled: saving
												})}
												values={dms?.map(dm => ({ key: dm.DCI, value: dm.name + (dm.DCI ? ` (${dm.DCI})` : "") })) || []}
												onSelect={val => {
													setDM(dms?.find(dm => dm.DCI === val));
												}}
											/>
											<label className="label">
												<span className="label-text-alt text-error">{form.formState.errors.dm?.DCI?.message}</span>
											</label>
										</div>
									</>
								)}
								<div className="form-control col-span-12 sm:col-span-4">
									<label className="label">
										<span className="label-text">Season</span>
									</label>
									<select
										value={season}
										onChange={e => setSeason(parseInt(e.target.value) as 1 | 8 | 9)}
										disabled={saving}
										className="select-bordered select w-full">
										<option value={9}>Season 9+</option>
										<option value={8}>Season 8</option>
										<option value={1}>Season 1-7</option>
									</select>
								</div>
								{season === 1 && (
									<div className="form-control col-span-6 w-full sm:col-span-4">
										<label className="label">
											<span className="label-text">Experience</span>
										</label>
										<input
											type="number"
											{...form.register("experience", { value: selectedLog.experience, disabled: saving, valueAsNumber: true })}
											className="input-bordered input w-full focus:border-primary"
										/>
										<label className="label">
											<span className="label-text-alt text-error">{form.formState.errors.experience?.message}</span>
										</label>
									</div>
								)}
								{season === 9 && (
									<div className="form-control col-span-12 w-full sm:col-span-4">
										<label className="label">
											<span className="label-text">Level</span>
										</label>
										<input
											type="number"
											min="0"
											max={Math.max(selectedLog.level, character ? 20 - character.total_level : 19)}
											{...form.register("level", {
												value: selectedLog.level,
												min: 0,
												max: Math.max(selectedLog.level, character ? 20 - character.total_level : 19),
												disabled: saving,
												valueAsNumber: true
											})}
											className="input-bordered input w-full focus:border-primary"
										/>
										<label className="label">
											<span className="label-text-alt text-error">{form.formState.errors.level?.message}</span>
										</label>
									</div>
								)}
							</>
						)}
						{(season === 8 || type === "nongame") && (
							<>
								{type === "game" && (
									<div className="form-control col-span-6 w-full sm:col-span-2">
										<label className="label">
											<span className="label-text">ACP</span>
										</label>
										<input
											type="number"
											{...form.register("acp", { value: selectedLog.acp, disabled: saving, valueAsNumber: true })}
											className="input-bordered input w-full focus:border-primary"
										/>
										<label className="label">
											<span className="label-text-alt text-error">{form.formState.errors.acp?.message}</span>
										</label>
									</div>
								)}
								<div className={twMerge("form-control w-full", type === "nongame" ? "col-span-4" : "col-span-6 sm:col-span-2")}>
									<label className="label">
										<span className="label-text">TCP</span>
									</label>
									<input
										type="number"
										{...form.register("tcp", { value: selectedLog.tcp, disabled: saving, valueAsNumber: true })}
										className="input-bordered input w-full focus:border-primary"
									/>
									<label className="label">
										<span className="label-text-alt text-error">{form.formState.errors.tcp?.message}</span>
									</label>
								</div>
							</>
						)}
						<div className={twMerge("form-control w-full", type === "game" ? "col-span-6 sm:col-span-2" : "col-span-4")}>
							<label className="label">
								<span className="label-text">Gold</span>
							</label>
							<input
								type="number"
								{...form.register("gold", { value: selectedLog.gold, disabled: saving, valueAsNumber: true })}
								className="input-bordered input w-full focus:border-primary"
							/>
							<label className="label">
								<span className="label-text-alt text-error">{form.formState.errors.gold?.message}</span>
							</label>
						</div>
						<div className={twMerge("form-control w-full", type === "game" ? "col-span-6 sm:col-span-2" : "col-span-4")}>
							<label className="label">
								<span className="label-text overflow-hidden text-ellipsis whitespace-nowrap">Downtime Days</span>
							</label>
							<input
								type="number"
								{...form.register("dtd", { value: selectedLog.dtd, disabled: saving, valueAsNumber: true })}
								className="input-bordered input w-full focus:border-primary"
							/>
							<label className="label">
								<span className="label-text-alt text-error">{form.formState.errors.dtd?.message}</span>
							</label>
						</div>
					</div>
					<div className="form-control col-span-12 w-full">
						<label className="label">
							<span className="label-text">Notes</span>
						</label>
						<AutoResizeTextArea
							{...form.register("description", { value: selectedLog.description || "", disabled: saving })}
							className="textarea-bordered textarea w-full focus:border-primary"
						/>
						<label className="label">
							<span className="label-text-alt text-error">{form.formState.errors.description?.message}</span>
							<span className="label-text-alt">Markdown Allowed</span>
						</label>
					</div>
					<div className="col-span-12 flex flex-wrap gap-4">
						<button type="button" className="btn-primary btn-sm btn min-w-fit flex-1 sm:flex-none" onClick={addMagicItem} disabled={saving}>
							Add Magic Item
						</button>
						{!selectedLog.is_dm_log && magicItems.filter(item => !magicItemsLost.includes(item.id)).length > 0 && (
							<button type="button" className="btn-sm btn min-w-fit flex-1 sm:flex-none" onClick={addLostMagicItem} disabled={saving}>
								Drop Magic Item
							</button>
						)}
						{type === "game" && (
							<>
								<button type="button" className="btn-primary btn-sm btn min-w-fit flex-1 sm:flex-none" onClick={addStoryAward} disabled={saving}>
									Add Story Award
								</button>
								{!selectedLog.is_dm_log && storyAwards.filter(item => !storyAwardsLost.includes(item.id)).length > 0 && (
									<button type="button" className="btn-sm btn min-w-fit flex-1 sm:flex-none" onClick={addLostStoryAward} disabled={saving}>
										Drop Story Award
									</button>
								)}
							</>
						)}
					</div>
					<div className="col-span-12 grid grid-cols-12 gap-4">
						{magicItemsGained.map((item, index) => (
							<div key={`magicItemsGained${index}`} className="card col-span-12 h-[370px] bg-base-300/70 sm:col-span-6">
								<div className="card-body flex flex-col gap-4">
									<h4 className="text-2xl">Add Magic Item</h4>
									<div className="flex gap-4">
										<div className="form-control flex-1">
											<label className="label">
												<span className="label-text">Name</span>
											</label>
											<input
												type="text"
												value={item.name}
												onChange={e => {
													setMagicItemsGained(magicItemsGained.map((item, i) => (i === index ? { ...item, name: e.target.value } : item)));
												}}
												disabled={saving}
												className="input-bordered input w-full focus:border-primary"
											/>
											<label className="label">
												<span className="label-text-alt text-error">{(form.formState.errors.magic_items_gained || [])[index]?.name?.message}</span>
											</label>
										</div>
										<button type="button" className="btn-danger btn mt-9" onClick={() => removeMagicItem(index)}>
											<Icon path={mdiTrashCan} size={1} />
										</button>
									</div>
									<div className="form-control w-full">
										<label className="label">
											<span className="label-text">Description</span>
										</label>
										<textarea
											onChange={e => {
												setMagicItemsGained(magicItemsGained.map((item, i) => (i === index ? { ...item, description: e.target.value } : item)));
											}}
											disabled={saving}
											className="textarea-bordered textarea w-full focus:border-primary"
											style={{ resize: "none" }}
											value={item.description}
										/>
										<label className="label">
											<span className="label-text-alt text-error"></span>
											<span className="label-text-alt">Markdown Allowed</span>
										</label>
									</div>
								</div>
							</div>
						))}
						{magicItemsLost.map((id, index) => (
							<div key={`magicItemsLost${index}`} className="card col-span-12 bg-base-300/70 shadow-xl sm:col-span-6">
								<div className="card-body flex flex-col gap-4">
									<h4 className="text-2xl">Drop Magic Item</h4>
									<div className="flex gap-4">
										<div className="form-control flex-1">
											<label className="label">
												<span className="label-text">Select an Item</span>
											</label>
											<select
												value={id}
												onChange={e => {
													setMagicItemsLost(magicItemsLost.map((item, i) => (i === index ? e.target.value : item)));
												}}
												disabled={saving}
												className="select-bordered select w-full">
												{[...selectedLog.magic_items_lost.filter(i => i.id === id), ...magicItems].map(item => (
													<option key={item.id} value={item.id}>
														{item.name}
													</option>
												))}
											</select>
											<label className="label">
												<span className="label-text-alt text-error">{(form.formState.errors.magic_items_lost || [])[index]?.message}</span>
											</label>
										</div>
										<button type="button" className="btn-danger btn mt-9" onClick={() => removeLostMagicItem(index)}>
											<Icon path={mdiTrashCan} size={1} />
										</button>
									</div>
									<div className="text-sm">{magicItems.find(item => magicItemsLost[index] === item.id)?.description}</div>
								</div>
							</div>
						))}
						{storyAwardsGained.map((item, index) => (
							<div key={`storyAwardsGained${index}`} className="card col-span-12 h-[370px] bg-base-300/70 sm:col-span-6">
								<div className="card-body flex flex-col gap-4">
									<h4 className="text-2xl">Add Story Award</h4>
									<div className="flex gap-4">
										<div className="form-control flex-1">
											<label className="label">
												<span className="label-text">Name</span>
											</label>
											<input
												type="text"
												value={item.name}
												onChange={e => {
													setStoryAwardsGained(storyAwardsGained.map((item, i) => (i === index ? { ...item, name: e.target.value } : item)));
												}}
												disabled={saving}
												className="input-bordered input w-full focus:border-primary"
												style={{ resize: "none" }}
											/>
											<label className="label">
												<span className="label-text-alt text-error">{(form.formState.errors.story_awards_gained || [])[index]?.name?.message}</span>
											</label>
										</div>
										<button type="button" className="btn-danger btn mt-9" onClick={() => removeStoryAward(index)}>
											<Icon path={mdiTrashCan} size={1} />
										</button>
									</div>
									<div className="form-control w-full">
										<label className="label">
											<span className="label-text">Description</span>
										</label>
										<textarea
											onChange={e => {
												setStoryAwardsGained(storyAwardsGained.map((item, i) => (i === index ? { ...item, description: e.target.value } : item)));
											}}
											disabled={saving}
											className="textarea-bordered textarea w-full focus:border-primary"
											value={item.description}
										/>
										<label className="label">
											<span className="label-text-alt text-error"></span>
											<span className="label-text-alt">Markdown Allowed</span>
										</label>
									</div>
								</div>
							</div>
						))}
						{storyAwardsLost.map((id, index) => (
							<div key={`storyAwardsLost${index}`} className="card col-span-12 bg-base-300/70 shadow-xl sm:col-span-6">
								<div className="card-body flex flex-col gap-4">
									<h4 className="text-2xl">Drop Story Award</h4>
									<div className="flex gap-4">
										<div className="form-control flex-1">
											<label className="label">
												<span className="label-text">Select a Story Award</span>
											</label>
											<select
												value={id}
												onChange={e => {
													setStoryAwardsLost(storyAwardsLost.map((item, i) => (i === index ? e.target.value : item)));
												}}
												className="select-bordered select w-full">
												{[...selectedLog.story_awards_lost.filter(i => i.id === id), ...storyAwards].map(item => (
													<option key={item.id} value={item.id}>
														{item.name}
													</option>
												))}
											</select>
											<label className="label">
												<span className="label-text-alt text-error">{(form.formState.errors.story_awards_lost || [])[index]?.message}</span>
											</label>
										</div>
										<button type="button" className="btn-danger btn mt-9" onClick={() => removeLostStoryAward(index)}>
											<Icon path={mdiTrashCan} size={1} />
										</button>
									</div>
									<div className="text-sm">{storyAwards.find(item => storyAwardsLost[index] === item.id)?.description}</div>
								</div>
							</div>
						))}
					</div>
					<div className="col-span-12 text-center">
						<button type="submit" className={twMerge("btn-primary btn", saving && "loading")} disabled={saving}>
							Save Log
						</button>
					</div>
				</div>
			</form>
		</>
	);
}

export function EditDMLogForm({
	id,
	log,
	characters,
	saveLog
}: {
	id: string;
	log: LogData;
	characters: CharactersData;
	saveLog: (data: LogSchema) => SaveLogResult;
}) {
	const [isPending, startTransition] = useTransition();
	const [saving, setSaving] = useState(false);

	const form = useForm<LogSchema>({
		resolver: valibotResolver(logSchema)
	});

	const [date, setDate] = useState(log.date);
	const [season, setSeason] = useState<1 | 8 | 9>(log?.experience ? 1 : log?.acp ? 8 : 9);
	const [magicItemsGained, setMagicItemsGained] = useState(log.magic_items_gained.map(mi => ({ id: mi.id, name: mi.name, description: mi.description || "" })));
	const [storyAwardsGained, setStoryAwardsGained] = useState(
		(log?.story_awards_gained || []).map(mi => ({ id: mi.id, name: mi.name, description: mi.description || "" }))
	);
	const [mutError, setMutError] = useState<string | null>(null);

	const submitHandler = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		const activeName = document.activeElement?.getAttribute("name");
		if (activeName === "characterName" && !form.getValues("characterId")) return;

		if (form.getValues("characterId") && !(characters || []).find(c => c.id === form.getValues("characterId"))) {
			form.setError("characterId", { type: "manual", message: "Character not found" });
			return;
		}

		if (form.getValues("characterName") && !form.getValues("applied_date")) {
			form.setError("applied_date", { type: "manual", message: "Applied date is required if assigned character is entered" });
			return;
		}

		if (form.getValues("applied_date") && !form.getValues("characterId")) {
			form.setError("characterId", { type: "manual", message: "Assigned character is required if applied date is entered" });
			return;
		}

		form.handleSubmit(onSubmit)(e);
	};

	const onSubmit: SubmitHandler<LogSchema> = e => {
		form.clearErrors();

		const values = form.getValues();
		values.type = "game";
		values.is_dm_log = true;
		values.magic_items_gained = magicItemsGained;
		values.magic_items_lost = [];
		values.story_awards_gained = storyAwardsGained;
		values.story_awards_lost = [];

		if (!log.id) values.date = date.toISOString();

		const parsedResult = safeParse(logSchema, values);
		if (parsedResult.success) {
			setSaving(true);
			startTransition(async () => {
				const result = await saveLog(parsedResult.data);
				if (result.error) {
					setMutError(result.error);
					setSaving(false);
				}
			});
		} else {
			const flatErrors = flatten(parsedResult.error);
			for (const field in flatErrors.nested) {
				const fieldName = field as (typeof issueFields)[number];
				const message = flatErrors.nested[field]?.join(", ");
				const issueFields = ["date", "name", "dm.name", "description", "characterId", "experience", "acp", "tcp", "level", "gold"] as const;
				if (issueFields.find(i => i == field)) {
					form.setError(fieldName, { message });
				}
				if (field.match(/magic_items_gained\.\d+\.name/)) {
					form.setError(fieldName, { message });
				}
				if (field.match(/story_awards_gained\.\d+\.name/)) {
					form.setError(fieldName, { message });
				}
			}
		}
	};

	const addMagicItem = () => setMagicItemsGained([...magicItemsGained, { id: "", name: "", description: "" }]);
	const removeMagicItem = (index: number) => setMagicItemsGained(magicItemsGained.filter((_, i) => i !== index));

	const addStoryAward = () => setStoryAwardsGained([...storyAwardsGained, { id: "", name: "", description: "" }]);
	const removeStoryAward = (index: number) => setStoryAwardsGained(storyAwardsGained.filter((_, i) => i !== index));

	useEffect(() => {
		if (!isPending && saving) {
			setTimeout(() => setSaving(false), 2000);
		}
	}, [saving, isPending]);

	useEffect(() => {
		if (!log.id) {
			setDate(new Date());
		}
	}, [log]);

	useEffect(() => {
		form.setValue("date", formatDate(date));
	}, [date, form]);

	return (
		<>
			{mutError && (
				<div className="alert alert-error shadow-lg">
					<div>
						<Icon path={mdiAlertCircle} size={1} />
						<span>{mutError}</span>
					</div>
				</div>
			)}
			<form onSubmit={submitHandler}>
				<input type="hidden" {...form.register("id", { value: id === "new" ? "" : id })} />
				<input type="hidden" {...form.register("dm.id", { value: log.dm?.id || "" })} />
				<input type="hidden" {...form.register("dm.DCI", { value: null })} />
				<input type="hidden" {...form.register("dm.name", { value: log.dm?.name || "" })} />
				<input type="hidden" {...form.register("dm.uid", { value: log.dm?.uid || "" })} />
				<div className="grid grid-cols-12 gap-4">
					<div className={twMerge("form-control col-span-12", log.is_dm_log ? "sm:col-span-6 lg:col-span-3" : "sm:col-span-4")}>
						<label className="label">
							<span className="label-text">
								Title
								<span className="text-error">*</span>
							</span>
						</label>
						<input
							type="text"
							{...form.register("name", { required: true, value: log.name, disabled: saving })}
							className="input-bordered input w-full focus:border-primary"
							aria-invalid={form.formState.errors.name ? "true" : "false"}
						/>
						<label className="label">
							<span className="label-text-alt text-error">{form.formState.errors.name?.message}</span>
						</label>
					</div>
					<div className={twMerge("form-control col-span-12", log.is_dm_log ? "sm:col-span-6 lg:col-span-3" : "sm:col-span-4")}>
						<label className="label">
							<span className="label-text">
								Date
								<span className="text-error">*</span>
							</span>
						</label>
						<input
							type="datetime-local"
							className="input-bordered input w-full focus:border-primary"
							{...form.register("date", {
								value: formatDate(date),
								required: true,
								setValueAs: (v: string) => new Date(v || formatDate(date)).toISOString(),
								disabled: saving
							})}
						/>
						<label className="label">
							<span className="label-text-alt text-error">{form.formState.errors.date?.message}</span>
						</label>
					</div>
					<input type="hidden" {...form.register("characterId", { value: log.characterId || "", required: !!form.watch().applied_date })} />
					<div className="form-control col-span-12 sm:col-span-6 lg:col-span-3">
						<label className="label">
							<span className="label-text">
								Assigned Character
								{!!form.watch().applied_date && <span className="text-error">*</span>}
							</span>
						</label>
						<AutoFillSelect
							type="text"
							inputProps={form.register("characterName", {
								value: characters.find(c => c.id === log.characterId)?.name || "",
								disabled: saving,
								onChange: e => {
									form.setValue("characterId", "");
									form.setValue("applied_date", null);
									form.trigger("applied_date");
								}
							})}
							values={characters?.map(char => ({ key: char.id, value: char.name })) || []}
							searchBy="value"
							onSelect={val => {
								const character = characters.find(c => c.id === val);
								if (character) {
									form.setValue("characterName", character?.name || "");
									form.setValue("characterId", val.toString());
									form.setError("characterId", { type: "manual", message: "" });
								} else {
									form.setValue("characterName", "");
									form.setValue("characterId", "");
								}
								form.setValue("applied_date", null);
								form.trigger("applied_date");
							}}
						/>
						<label className="label">
							<span className="label-text-alt text-error">{form.formState.errors.characterId?.message}</span>
						</label>
					</div>
					<div className={twMerge("form-control col-span-12", "sm:col-span-6 lg:col-span-3")}>
						<label className="label">
							<span className="label-text">
								Assigned Date
								{!!form.watch().characterId && <span className="text-error">*</span>}
							</span>
						</label>
						<input
							type="datetime-local"
							{...form.register("applied_date", {
								value: log.applied_date ? formatDate(log.applied_date) : null,
								required: !!form.watch().characterId,
								setValueAs: (v: string) => (!form.watch().characterId ? null : formatDate(v) == "Invalid Date" ? "" : new Date(v).toISOString()),
								disabled: saving
							})}
							className="input-bordered input w-full focus:border-primary"
							aria-invalid={form.formState.errors.applied_date ? "true" : "false"}
						/>
						<label className="label">
							<span className="label-text-alt text-error">{form.formState.errors.applied_date?.message}</span>
						</label>
					</div>
					<div className="col-span-12 grid grid-cols-12 gap-4">
						<div className="form-control col-span-12 sm:col-span-4">
							<label className="label">
								<span className="label-text">Season</span>
							</label>
							<select
								value={season}
								onChange={e => setSeason(parseInt(e.target.value) as 1 | 8 | 9)}
								disabled={saving}
								className="select-bordered select w-full">
								<option value={9}>Season 9+</option>
								<option value={8}>Season 8</option>
								<option value={1}>Season 1-7</option>
							</select>
						</div>
						{season === 1 && (
							<div className="form-control col-span-6 w-full sm:col-span-4">
								<label className="label">
									<span className="label-text">Experience</span>
								</label>
								<input
									type="number"
									{...form.register("experience", {
										value: log.experience,
										disabled: saving,
										valueAsNumber: true
									})}
									className="input-bordered input w-full focus:border-primary"
								/>
								<label className="label">
									<span className="label-text-alt text-error">{form.formState.errors.experience?.message}</span>
								</label>
							</div>
						)}
						{season === 9 && (
							<div className="form-control col-span-12 w-full sm:col-span-4">
								<label className="label">
									<span className="label-text">Level</span>
								</label>
								<input
									type="number"
									min="0"
									max="1"
									{...form.register("level", {
										value: log.level,
										min: 0,
										max: 1,
										disabled: saving,
										valueAsNumber: true
									})}
									className="input-bordered input w-full focus:border-primary"
								/>
								<label className="label">
									<span className="label-text-alt text-error">{form.formState.errors.level?.message}</span>
								</label>
							</div>
						)}
						{season === 8 && (
							<>
								<div className="form-control col-span-6 w-full sm:col-span-2">
									<label className="label">
										<span className="label-text">ACP</span>
									</label>
									<input
										type="number"
										{...form.register("acp", { value: log.acp, disabled: saving, valueAsNumber: true })}
										className="input-bordered input w-full focus:border-primary"
									/>
									<label className="label">
										<span className="label-text-alt text-error">{form.formState.errors.acp?.message}</span>
									</label>
								</div>
								<div className={twMerge("form-control w-full", "col-span-6 sm:col-span-2")}>
									<label className="label">
										<span className="label-text">TCP</span>
									</label>
									<input
										type="number"
										{...form.register("tcp", { value: log.tcp, disabled: saving, valueAsNumber: true })}
										className="input-bordered input w-full focus:border-primary"
									/>
									<label className="label">
										<span className="label-text-alt text-error">{form.formState.errors.tcp?.message}</span>
									</label>
								</div>
							</>
						)}
						<div className={twMerge("form-control w-full", "col-span-12 sm:col-span-2")}>
							<label className="label">
								<span className="label-text">Gold</span>
							</label>
							<input
								type="number"
								{...form.register("gold", { value: log.gold, disabled: saving, valueAsNumber: true })}
								className="input-bordered input w-full focus:border-primary"
							/>
							<label className="label">
								<span className="label-text-alt text-error">{form.formState.errors.gold?.message}</span>
							</label>
						</div>
						<div className={twMerge("form-control w-full", "col-span-12 sm:col-span-2")}>
							<label className="label">
								<span className="label-text overflow-hidden text-ellipsis whitespace-nowrap">Downtime Days</span>
							</label>
							<input
								type="number"
								{...form.register("dtd", { value: log.dtd, disabled: saving, valueAsNumber: true })}
								className="input-bordered input w-full focus:border-primary"
							/>
							<label className="label">
								<span className="label-text-alt text-error">{form.formState.errors.dtd?.message}</span>
							</label>
						</div>
					</div>
					<div className="form-control col-span-12 w-full">
						<label className="label">
							<span className="label-text">Notes</span>
						</label>
						<AutoResizeTextArea
							{...form.register("description", { value: log.description || "", disabled: saving })}
							className="textarea-bordered textarea w-full focus:border-primary"
						/>
						<label className="label">
							<span className="label-text-alt text-error">{form.formState.errors.description?.message}</span>
							<span className="label-text-alt">Markdown Allowed</span>
						</label>
					</div>
					<div className="col-span-12 flex flex-wrap gap-4">
						<button type="button" className="btn-primary btn-sm btn min-w-fit flex-1 sm:flex-none" onClick={addMagicItem} disabled={saving}>
							Add Magic Item
						</button>
						<button type="button" className="btn-primary btn-sm btn min-w-fit flex-1 sm:flex-none" onClick={addStoryAward} disabled={saving}>
							Add Story Award
						</button>
					</div>
					<div className="col-span-12 grid grid-cols-12 gap-4">
						{magicItemsGained.map((item, index) => (
							<div key={`magicItemsGained${index}`} className="card col-span-12 h-[338px] bg-base-300/70 sm:col-span-6">
								<div className="card-body flex flex-col gap-4">
									<h4 className="text-2xl">Add Magic Item</h4>
									<div className="flex gap-4">
										<div className="form-control flex-1">
											<label className="label">
												<span className="label-text">Name</span>
											</label>
											<input
												type="text"
												value={item.name}
												onChange={e => {
													setMagicItemsGained(magicItemsGained.map((item, i) => (i === index ? { ...item, name: e.target.value } : item)));
												}}
												disabled={saving}
												className="input-bordered input w-full focus:border-primary"
											/>
											<label className="label">
												<span className="label-text-alt text-error">{(form.formState.errors.magic_items_gained || [])[index]?.name?.message}</span>
											</label>
										</div>
										<button type="button" className="btn-danger btn mt-9" onClick={() => removeMagicItem(index)} disabled={saving}>
											<Icon path={mdiTrashCan} size={1} />
										</button>
									</div>
									<div className="form-control w-full">
										<label className="label">
											<span className="label-text">Description</span>
										</label>
										<textarea
											onChange={e => {
												setMagicItemsGained(magicItemsGained.map((item, i) => (i === index ? { ...item, description: e.target.value } : item)));
											}}
											disabled={saving}
											className="textarea-bordered textarea w-full focus:border-primary"
											style={{ resize: "none" }}
											value={item.description}
										/>
										<label className="label">
											<span className="label-text-alt text-error"></span>
											<span className="label-text-alt">Markdown Allowed</span>
										</label>
									</div>
								</div>
							</div>
						))}
						{storyAwardsGained.map((item, index) => (
							<div key={`storyAwardsGained${index}`} className="card col-span-12 h-[370px] bg-base-300/70 sm:col-span-6">
								<div className="card-body flex flex-col gap-4">
									<h4 className="text-2xl">Add Story Award</h4>
									<div className="flex gap-4">
										<div className="form-control flex-1">
											<label className="label">
												<span className="label-text">Name</span>
											</label>
											<input
												type="text"
												value={item.name}
												onChange={e => {
													setStoryAwardsGained(storyAwardsGained.map((item, i) => (i === index ? { ...item, name: e.target.value } : item)));
												}}
												disabled={saving}
												className="input-bordered input w-full focus:border-primary"
											/>
											<label className="label">
												<span className="label-text-alt text-error">{(form.formState.errors.story_awards_gained || [])[index]?.name?.message}</span>
											</label>
										</div>
										<button type="button" className="btn-danger btn mt-9" onClick={() => removeStoryAward(index)} disabled={saving}>
											<Icon path={mdiTrashCan} size={1} />
										</button>
									</div>
									<div className="form-control w-full">
										<label className="label">
											<span className="label-text">Description</span>
										</label>
										<textarea
											onChange={e => {
												setStoryAwardsGained(storyAwardsGained.map((item, i) => (i === index ? { ...item, description: e.target.value } : item)));
											}}
											disabled={saving}
											className="textarea-bordered textarea w-full focus:border-primary"
											value={item.description}
										/>
										<label className="label">
											<span className="label-text-alt text-error"></span>
											<span className="label-text-alt">Markdown Allowed</span>
										</label>
									</div>
								</div>
							</div>
						))}
					</div>
					<div className="col-span-12 text-center">
						<button type="submit" className={twMerge("btn-primary btn", saving && "loading")} disabled={saving}>
							Save Log
						</button>
					</div>
				</div>
			</form>
		</>
	);
}

export function EditDMForm({ dm, saveDM }: { dm: Exclude<UserDMWithLogs, null>; saveDM: (dm: DungeonMasterSchema) => SaveDMResult }) {
	const [isPending, startTransition] = useTransition();
	const [saving, setSaving] = useState(false);

	const form = useForm<DungeonMasterSchema>({
		resolver: valibotResolver(dungeonMasterSchema)
	});

	const submitHandler = form.handleSubmit(data => {
		setSaving(true);
		startTransition(() => {
			saveDM(data);
		});
	});

	useEffect(() => {
		if (!isPending && saving) {
			setTimeout(() => setSaving(false), 2000);
		}
	}, [saving, isPending]);

	return (
		<form onSubmit={submitHandler}>
			<input type="hidden" {...form.register("id", { value: dm.id })} />
			<div className="flex flex-wrap">
				<div className="basis-full px-2 sm:basis-1/2">
					<div className="form-control w-full">
						<label className="label">
							<span className="label-text">
								DM Name
								<span className="text-error">*</span>
							</span>
						</label>
						<input
							type="text"
							{...form.register("name", { required: true, value: dm.name, disabled: saving })}
							className="input-bordered input w-full focus:border-primary"
						/>
						<label className="label">
							<span className="label-text-alt text-error">{form.formState.errors.name?.message}</span>
						</label>
					</div>
				</div>
				<div className="basis-full px-2 sm:basis-1/2">
					<div className="form-control w-full">
						<label className="label">
							<span className="label-text">DCI</span>
						</label>
						<input
							type="text"
							{...form.register("DCI", { value: dm.DCI || "", disabled: saving })}
							className="input-bordered input w-full focus:border-primary"
						/>
						<label className="label">
							<span className="label-text-alt text-error">{form.formState.errors.DCI?.message}</span>
						</label>
					</div>
				</div>
				<div className="m-4 basis-full text-center">
					<button type="submit" className={twMerge("btn-primary btn", saving && "loading")} disabled={saving}>
						Update
					</button>
				</div>
			</div>
		</form>
	);
}
