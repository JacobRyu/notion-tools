import { z } from "zod";

// --- Common ---

export const apiColorSchema = z.enum([
  "default", "gray", "brown", "orange", "yellow", "green", "blue",
  "purple", "pink", "red", "gray_background", "brown_background",
  "orange_background", "yellow_background", "green_background",
  "blue_background", "purple_background", "pink_background", "red_background",
]);

export const richTextSchema = z.object({
  type: z.literal("text"),
  text: z.object({ content: z.string(), link: z.object({ url: z.string() }).nullable().optional() }),
  annotations: z.object({
    bold: z.boolean().optional(),
    italic: z.boolean().optional(),
    strikethrough: z.boolean().optional(),
    underline: z.boolean().optional(),
    code: z.boolean().optional(),
    color: apiColorSchema.optional(),
  }).optional(),
  plain_text: z.string().optional(),
  href: z.string().nullable().optional(),
});

// --- Property types ---

export const titlePropertySchema = z.object({
  type: z.literal("title"),
  title: z.array(richTextSchema),
});

export const richTextPropertySchema = z.object({
  type: z.literal("rich_text"),
  rich_text: z.array(richTextSchema),
});

export const numberPropertySchema = z.object({
  type: z.literal("number"),
  number: z.number().nullable(),
});

export const selectOptionSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  color: apiColorSchema.optional(),
});

export const selectPropertySchema = z.object({
  type: z.literal("select"),
  select: selectOptionSchema.nullable(),
});

export const multiSelectPropertySchema = z.object({
  type: z.literal("multi_select"),
  multi_select: z.array(selectOptionSchema),
});

export const statusPropertySchema = z.object({
  type: z.literal("status"),
  status: z.object({ id: z.string().optional(), name: z.string(), color: apiColorSchema.optional() }).nullable(),
});

export const datePropertySchema = z.object({
  type: z.literal("date"),
  date: z.object({
    start: z.string(),
    end: z.string().nullable().optional(),
    time_zone: z.string().nullable().optional(),
  }).nullable(),
});

export const checkboxPropertySchema = z.object({
  type: z.literal("checkbox"),
  checkbox: z.boolean(),
});

export const urlPropertySchema = z.object({
  type: z.literal("url"),
  url: z.string().nullable(),
});

export const emailPropertySchema = z.object({
  type: z.literal("email"),
  email: z.string().nullable(),
});

export const phoneNumberPropertySchema = z.object({
  type: z.literal("phone_number"),
  phone_number: z.string().nullable(),
});

export const peoplePropertySchema = z.object({
  type: z.literal("people"),
  people: z.array(z.object({ id: z.string() })),
});

export const filesPropertySchema = z.object({
  type: z.literal("files"),
  files: z.array(z.object({
    name: z.string(),
    type: z.enum(["file", "external"]).optional(),
    file: z.object({ url: z.string(), expiry_time: z.string().optional() }).optional(),
    external: z.object({ url: z.string() }).optional(),
  })),
});

export const relationPropertySchema = z.object({
  type: z.literal("relation"),
  relation: z.array(z.object({ id: z.string() })),
});

export const formulaPropertySchema = z.object({
  type: z.literal("formula"),
  formula: z.any(),
});

export const rollupPropertySchema = z.object({
  type: z.literal("rollup"),
  rollup: z.any(),
});

export const createdTimePropertySchema = z.object({
  type: z.literal("created_time"),
  created_time: z.string(),
});

export const createdByPropertySchema = z.object({
  type: z.literal("created_by"),
  created_by: z.object({ id: z.string(), object: z.literal("user").optional() }),
});

export const lastEditedTimePropertySchema = z.object({
  type: z.literal("last_edited_time"),
  last_edited_time: z.string(),
});

export const lastEditedByPropertySchema = z.object({
  type: z.literal("last_edited_by"),
  last_edited_by: z.object({ id: z.string(), object: z.literal("user").optional() }),
});

// --- Union of all property types ---

export const notionPropertySchema = z.union([
  titlePropertySchema,
  richTextPropertySchema,
  numberPropertySchema,
  selectPropertySchema,
  multiSelectPropertySchema,
  statusPropertySchema,
  datePropertySchema,
  checkboxPropertySchema,
  urlPropertySchema,
  emailPropertySchema,
  phoneNumberPropertySchema,
  peoplePropertySchema,
  filesPropertySchema,
  relationPropertySchema,
  formulaPropertySchema,
  rollupPropertySchema,
  createdTimePropertySchema,
  createdByPropertySchema,
  lastEditedTimePropertySchema,
  lastEditedByPropertySchema,
]);

export const notionPropertiesSchema = z.record(z.string(), notionPropertySchema);

// --- Property value for page creation (request) ---

export const pageCreatePropertiesSchema = z.record(
  z.string(),
  z.union([
    titlePropertySchema,
    richTextPropertySchema.omit({ rich_text: true }).extend({
      rich_text: z.array(richTextSchema),
    }),
    numberPropertySchema,
    selectPropertySchema,
    multiSelectPropertySchema,
    statusPropertySchema,
    datePropertySchema,
    checkboxPropertySchema,
    urlPropertySchema,
    emailPropertySchema,
    phoneNumberPropertySchema,
    peoplePropertySchema,
    filesPropertySchema,
    relationPropertySchema,
  ]),
);

// --- Database property definition (schema) ---

export const databasePropertyDefinitionSchema = z.object({
  name: z.string(),
  type: z.enum([
    "title", "rich_text", "number", "select", "multi_select", "status",
    "date", "checkbox", "url", "email", "phone_number", "people",
    "files", "relation", "formula", "rollup", "created_time",
    "created_by", "last_edited_time", "last_edited_by",
  ]),
  select: z.object({ options: z.array(selectOptionSchema) }).optional(),
  multi_select: z.object({ options: z.array(selectOptionSchema) }).optional(),
  status: z.object({
    options: z.array(z.object({ name: z.string(), color: apiColorSchema.optional() })).optional(),
    groups: z.array(z.any()).optional(),
  }).optional(),
  number: z.object({ format: z.string().optional() }).optional(),
  relation: z.object({ database_id: z.string(), type: z.string().optional(), single_property: z.string().optional() }).optional(),
  rollup: z.any().optional(),
});

// --- Types ---

export type NotionProperty = z.infer<typeof notionPropertySchema>;
export type NotionProperties = z.infer<typeof notionPropertiesSchema>;
export type PageCreateProperties = z.infer<typeof pageCreatePropertiesSchema>;
export type DatabasePropertyDefinition = z.infer<typeof databasePropertyDefinitionSchema>;
export type RichText = z.infer<typeof richTextSchema>;
export type SelectOption = z.infer<typeof selectOptionSchema>;
