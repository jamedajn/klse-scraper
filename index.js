import fs from 'fs'
import { Worker } from "worker_threads";
const indexes = fs.readFileSync("./indexes.txt", { encoding: 'utf-8' }).split('\r\n')
const data = []
const jobs = []
const thread_count = 4
console.log(indexes.length, "of indexes to scrape")

async function createWorker(i) {
    return new Promise(function (resolve, reject) {
      const worker = new Worker("./speeder.js", {
        workerData: { thread_count: i, jobs },
      });
      worker.on("message", (dt) => {
        if (dt == "end") {
          worker.terminate();
          resolve(dt);
        }else {
        data.push(dt)
        console.log(`${data.length}/${indexes.length}`,dt)
        }
      });
      worker.on("error", (msg) => {
        reject(`An error ocurred: ${msg}`);
      });
    });
  }

;(async() => {
const start = performance.now()
for (let i = 0; i < indexes.length; i += indexes.length / thread_count) {
    jobs.push(indexes.slice(i, i + indexes.length / thread_count));
  }
    const workerPromises = [];
  for (let i = 0; i < thread_count; i++) {
    workerPromises.push(await createWorker(i));
  }
  await Promise.all(workerPromises);
  fs.writeFileSync(
    "./data/data.txt",
    data.join("\n"),
  );
  fs.writeFileSync(
    `./data/${new Date().toLocaleString("en-US", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    }).split("/").join("-")}.txt`,
    data.join("\n")
  );
  const end = performance.now()
  console.log("Job done with", data.length, "indexes in", Math.round((end - start) / 1000), 'seconds')
  })()
