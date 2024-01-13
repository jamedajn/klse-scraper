import { workerData, parentPort } from "worker_threads";
import puppeteer from "puppeteer";

(async () => {
    const job = workerData.jobs[workerData.thread_count];
    console.log('Running on new thread with', job.length, "of jobs")
    for (let index of job) {
      try {
        const browser = await puppeteer.launch({
            headless: "new"
          });
        
          const page = await browser.newPage();
          await page.setUserAgent("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.0 Safari/537.36");
          await page.goto(`https://www.klsescreener.com/v2/stocks/view/${index}`, {waitUntil: ['networkidle0'], timeout: 180000});
        
          var name = await page.evaluate(
            `document.querySelector(".d-flex .align-items-baseline h2").innerText`,
            { timeout: 180000 },
          );
          var price = await page.evaluate(
            `document.getElementById("price").innerText`,
            { timeout: 180000 },
          );
          await browser.close();
        parentPort.postMessage(`${name} ${price}`);
      } catch (e) {
          console.log(e)
      }
    }
  
    parentPort.postMessage("end");
  })();
