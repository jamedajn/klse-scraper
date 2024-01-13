import puppeteer from 'puppeteer';
import fs from 'fs'
const indexes = fs.readFileSync("./indexes.txt", { encoding: 'utf-8' }).split('\r\n')
const wait = (time) => new Promise((resolve) => setTimeout(() => resolve(), time));
(async () => {
    for(var index of indexes) {
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
  console.log(name, price)
  
  await browser.close();
}catch(e) {}

  }
})();