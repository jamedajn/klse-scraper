const { workerData, parentPort } = require("worker_threads");
const puppeteer = require("puppeteer");

(async () => {
    const job = workerData.jobs[workerData.thread_count];
    console.log('Running on new thread with', job.length, "of jobs");

    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }).catch(console.log);

    const TIMEOUT = 180000; // 3 minutes

    for (let index of job) {
        try {
            await Promise.race([
                (async () => {
                    const page = await browser.newPage();
                    await page.setUserAgent("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.0 Safari/537.36");
                    await page.goto(`https://www.klsescreener.com/v2/stocks/view/${index}`, {
                        waitUntil: ['networkidle0'],
                        timeout: TIMEOUT
                    });

                    const name = await page.evaluate(() => {
                        const el = document.querySelector(".d-flex .align-items-baseline h2");
                        return el ? el.innerText : null;
                    });

                    const price = await page.evaluate(() => {
                        const el = document.getElementById("price");
                        return el ? el.innerText : 0;
                    });

                    parentPort.postMessage(`${index} ${name} ${price}`);
                    await page.close();
                })(),
                new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout reached")), TIMEOUT))
            ]);
        } catch (e) {
            console.log(`Error with job ${index}:`, e.message || e);
        }
    }

    await browser.close();
    parentPort.postMessage("end");
})();
