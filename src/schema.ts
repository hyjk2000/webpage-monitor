import { z } from "zod";

const Selection = z
  .object({
    selector: z.string(),
  })
  .strict();

const WatchItem = z
  .object({
    title: z.string(),
    url: z.string().url(),
    headers: z.record(z.string()).optional(),
    selections: z.array(Selection),
    cron: z
      .string()
      .regex(
        /(((\d+,)+\d+|(\d+(\/|-)\d+)|\d+|\*) ?){5,7}/,
        "Must be valid cron statement"
      ),
  })
  .strict();

export const WatchList = z.array(WatchItem);

export type WatchList = z.infer<typeof WatchList>;
