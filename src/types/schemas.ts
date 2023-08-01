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
	safeParse,
	string,
	union,
	url,
	useDefault as def
} from "valibot";

export const dateSchema = union([date(), string([isoTimestamp()])]);

export type DungeonMasterSchema = Output<typeof dungeonMasterSchema>;
export const dungeonMasterSchema = object({
	id: string(),
	name: string([minLength(1, "Required")]),
	DCI: def(nullable(string([regex(/[0-9]{0,10}/, "Invalid DCI Format")])), null),
	uid: def(nullish(string()), "")
});

export type LogSchema = Output<typeof logSchema>;
export const logSchema = object({
	id: def(string(), ""),
	name: string([minLength(1, "Required")]),
	date: dateSchema,
	characterId: def(string(), ""),
	characterName: def(string(), ""),
	type: def(union([literal("game"), literal("nongame")]), "game"),
	experience: def(number("Must be a number"), 0),
	acp: def(number([minValue(0, "Must be a non-negative number")]), 0),
	tcp: def(number("Must be a number"), 0),
	level: def(number([minValue(0, "Must be a non-negative number")]), 0),
	gold: def(number("Must be a number"), 0),
	dtd: def(number("Must be a number"), 0),
	description: def(string(), ""),
	dm: object({
		id: def(string(), ""),
		name: def(string(), ""),
		DCI: def(nullable(string([regex(/[0-9]{0,10}/, "Invalid DCI Format")])), null),
		uid: def(nullish(string()), "")
	}),
	is_dm_log: def(boolean(), false),
	applied_date: def(nullable(dateSchema), null),
	magic_items_gained: def(
		array(
			object({
				id: def(string(), ""),
				name: string([minLength(1, "Required")]),
				description: def(string(), "")
			})
		),
		[]
	),
	magic_items_lost: def(array(string([minLength(1, "Required")])), []),
	story_awards_gained: def(
		array(
			object({
				id: def(string(), ""),
				name: string([minLength(1, "Required")]),
				description: def(string(), "")
			})
		),
		[]
	),
	story_awards_lost: def(array(string([minLength(1, "Required")])), [])
});

export type NewCharacterSchema = Output<typeof newCharacterSchema>;
export const newCharacterSchema = object({
	name: string([minLength(1, "Required")]),
	campaign: string([minLength(1, "Required")]),
	race: def(string(), ""),
	class: def(string(), ""),
	character_sheet_url: def(string([url()]), ""),
	image_url: def(string([url()]), "")
});

export type EditCharacterSchema = Output<typeof editCharacterSchema>;
export const editCharacterSchema = merge([object({ id: string() }), newCharacterSchema]);

export const valibotResolver = <T extends ObjectShape>(schema: ObjectSchema<T>) => {
	return (async values => {
		const parsedValues = safeParse(schema, values);

		if (!parsedValues.success) {
			const errors = flatten(parsedValues.error);
			return {
				values,
				errors: Object.fromEntries(Object.entries(errors.nested).map(([key, value]) => [key, { message: value?.join(", ") }]))
			};
		}

		return {
			values: parsedValues.data,
			errors: {}
		};
	}) satisfies Resolver<Output<typeof schema>>;
};
