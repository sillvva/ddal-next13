import { Resolver } from "react-hook-form";
import {
	array,
	boolean,
	date,
	flatten,
	isoTimestamp,
	literal,
	merge,
	minLength,
	minValue,
	nullable,
	nullish,
	number,
	object,
	ObjectSchema,
	ObjectShape,
	Output,
	regex,
	string,
	union,
	url,
	useDefault,
	ValiError
} from "valibot";

export const dateSchema = union([date(), string([isoTimestamp()])]);

export type DungeonMasterSchema = Output<typeof dungeonMasterSchema>;
export const dungeonMasterSchema = object({
	id: string(),
	name: string([minLength(1, "Required")]),
	DCI: useDefault(nullable(string([regex(/[0-9]{0,10}/, "Invalid DCI Format")])), null),
	uid: useDefault(nullish(string()), "")
});

export type LogSchema = Output<typeof logSchema>;
export const logSchema = object({
	id: useDefault(string(), ""),
	name: string([minLength(1, "Required")]),
	date: dateSchema,
	characterId: useDefault(string(), ""),
	characterName: useDefault(string(), ""),
	type: useDefault(union([literal("game"), literal("nongame")]), "game"),
	experience: useDefault(number("Must be a number"), 0),
	acp: useDefault(number([minValue(0, "Must be a non-negative number")]), 0),
	tcp: useDefault(number("Must be a number"), 0),
	level: useDefault(number([minValue(0, "Must be a non-negative number")]), 0),
	gold: useDefault(number("Must be a number"), 0),
	dtd: useDefault(number("Must be a number"), 0),
	description: useDefault(string(), ""),
	dm: object({
		id: useDefault(string(), ""),
		name: useDefault(string(), ""),
		DCI: useDefault(nullable(string([regex(/[0-9]{0,10}/, "Invalid DCI Format")])), null),
		uid: useDefault(nullish(string()), "")
	}),
	is_dm_log: useDefault(boolean(), false),
	applied_date: useDefault(nullable(dateSchema), null),
	magic_items_gained: useDefault(
		array(
			object({
				id: useDefault(string(), ""),
				name: string([minLength(1, "Required")]),
				description: useDefault(string(), "")
			})
		),
		[]
	),
	magic_items_lost: useDefault(array(string([minLength(1, "Required")])), []),
	story_awards_gained: useDefault(
		array(
			object({
				id: useDefault(string(), ""),
				name: string([minLength(1, "Required")]),
				description: useDefault(string(), "")
			})
		),
		[]
	),
	story_awards_lost: useDefault(array(string([minLength(1, "Required")])), [])
});

export type NewCharacterSchema = Output<typeof newCharacterSchema>;
export const newCharacterSchema = object({
	name: string([minLength(1, "Required")]),
	campaign: string([minLength(1, "Required")]),
	race: useDefault(string(), ""),
	class: useDefault(string(), ""),
	character_sheet_url: useDefault(string([url()]), ""),
	image_url: useDefault(string([url()]), "")
});

export type EditCharacterSchema = Output<typeof editCharacterSchema>;
export const editCharacterSchema = merge([object({ id: string() }), newCharacterSchema]);

export const valibotResolver = <T extends ObjectShape>(schema: ObjectSchema<T>) => {
	return (async values => {
		try {
			const parsedValues = schema.parse(values);
			return {
				values: parsedValues,
				errors: {}
			};
		} catch (err) {
			if (err instanceof ValiError) {
				const errors = flatten(err);
				return {
					values,
					errors: Object.fromEntries(Object.entries(errors.nested).map(([key, value]) => [key, { message: value?.join(", ") }]))
				};
			} else if (err instanceof Error) {
				return {
					values,
					errors: {
						form: {
							message: err.message
						}
					}
				};
			} else if (typeof err === "string") {
				return {
					values,
					errors: {
						form: {
							message: err
						}
					}
				};
			} else {
				return {
					values,
					errors: {
						form: {
							message: "An unknown error occurred"
						}
					}
				};
			}
		}
	}) satisfies Resolver<Output<typeof schema>>;
};
