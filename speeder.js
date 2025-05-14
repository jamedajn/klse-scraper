const { workerData, parentPort } = require("worker_threads");
const puppeteer = require("puppeteer");

(async () => {
    const job = workerData.jobs[workerData.thread_count];
    console.log('Running on new thread with', job.length, "jobs");

    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const TIMEOUT = 180000; // 3 minutes

    for (let index of job) {
        let page = null;
        try {
            const result = await Promise.race([
                (async () => {
                    page = await browser.newPage();
                    await page.setUserAgent("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.0 Safari/537.36");
                    await page.goto(`https://www.klsescreener.com/v2/stocks/view/${index}`, {
                        waitUntil: 'networkidle0',
                        timeout: TIMEOUT
                    });

                    const name = await page.evaluate(() => {
                        const el = document.querySelector(".d-flex .align-items-baseline h2");
                        return el ? el.innerText : null;
                    });

                    const price = await page.evaluate(() => {
                        const el = document.getElementById("price");
                        return el ? el.innerText : "0";
                    });

                    return `${index} ${name} ${price}`;
                })(),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Timeout")), TIMEOUT))
            ]);

            parentPort.postMessage(result);
        } catch (e) {
            console.log(`Job ${index} failed:`, e.message);
        } finally {
            if (page) {
                try {
                    await page.close({ runBeforeUnload: false });
                } catch (err) {
                    console.log(`Failed to close page for job ${index}:`, err.message);
                }
            }
        }
    }

    await browser.close();
    parentPort.postMessage("end");
})();               })(),
                new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout reached")), TIMEOUT))
            ]);
        } catch (e) {
            console.log(`Error with job ${index}:`, e.message || e);
        }
    }

    await browser.close();
    parentPort.postMessage("end");
})();
