import axios from "axios";
import { CronJob } from "cron";
import { Change, diffLines } from "diff";
import { readFileSync } from "fs";
import { JSDOM } from "jsdom";
import { WatchList } from "./schema";

const { IFTTT_WEBHOOK_EVENT, IFTTT_WEBHOOK_KEY } = process.env;

const watchListFile = process.argv[process.argv.length - 1];
const watchList = WatchList.parse(
  JSON.parse(readFileSync(watchListFile, { encoding: "utf-8" }))
);

const storage = new Map();

function getDiff(idx: number, content: string): Change[] {
  const oldContent = storage.has(idx) ? storage.get(idx) : "";
  storage.set(idx, content);
  return diffLines(oldContent, content);
}

function sendDiff(idx: number, diff: Change[]) {
  const { title } = watchList[idx];
  const content = diff
    .map(
      ({ added, removed, value }) =>
        `${added ? "+" : removed ? "-" : "="} ${value}`
    )
    .join("\n");
  return axios.post(
    `https://maker.ifttt.com/trigger/${IFTTT_WEBHOOK_EVENT}/with/key/${IFTTT_WEBHOOK_KEY}`,
    {
      value1: title,
      value2: content,
    }
  );
}

watchList.forEach(({ cron, url, headers, selections }, idx) => {
  const job = new CronJob(cron, async () => {
    const { data } = await axios.get(url, { headers });
    const {
      window: { document },
    } = new JSDOM(data, {
      url,
      contentType: "text/html",
    });

    const content = selections
      .map(({ selector }) =>
        document.querySelector(selector)?.textContent?.replace(/(\n)+/g, "\n")
      )
      .join("\n");

    const diff = getDiff(idx, content);
    if (diff.some(({ added, removed }) => added || removed)) {
      sendDiff(idx, diff);
    }
  });
  job.start();
});
