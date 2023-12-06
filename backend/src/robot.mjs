import puppeteer from "puppeteer-extra";
import userAgent from "user-agents";
import stealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(stealthPlugin());

async function initBrowser() {
  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/chromium-browser",
    headless: false,
  });
  return browser;
}

async function createPage(browser, url) {
  const userAgentString = userAgent.random().toString();
  const page = await browser.newPage();
  await page.setUserAgent(userAgentString);
  await page.setViewport({ width: 1080, height: 1024 });
  await page.goto(url);
  return page;
}

export async function fetchDoctors(doctor) {
  const { name, uf, crm, city } = doctor;

  async function execute() {
    const browser = await initBrowser();
    const page = await createPage(
      browser,
      "https://portal.cfm.org.br/busca-medicos/"
    );

    await page.type('input[name="nome"]', name, {
      delay: 150,
    });

    await page.select("#uf", uf);

    await page.type(
      "#buscaForm > div > div:nth-child(1) > div:nth-child(3) > div > input",
      crm,
      {
        delay: 150,
      }
    );

    await page.waitForTimeout(2000);

    const selectElement = await page.$("#municipio");
    const optionText = city;

    if (!city) {
      const optionValue = await page.evaluate(
        (select, text) => {
          const options = select.querySelectorAll("option");
          for (const option of options) {
            if (option.textContent === text) {
              return option.value;
            }
          }
          return null;
        },
        selectElement,
        optionText
      );

      if (optionValue) {
        await page.select("#municipio", optionValue);
      }
    }

    await page.select("#inscricao", "P");
    await page.select("#tipoSituacao", "A");
    await page.waitForTimeout(1000);
    await page.select("#situacao", "A");

    await page.click(
      "#buscaForm > div > div.row.my-4 > div.col-md-2.text-right > button"
    );

    let hasDoctors = false;

    try {
      await page.waitForSelector(
        "#content > section.page-content.institucional-content > div > div > div > div.busca-resultado > div > p",
        { timeout: 10000 }
      );
      hasDoctors = false;
    } catch (error) {
      hasDoctors = true;
    }

    await browser.close();
    return hasDoctors;
  }

  const hasDoctors = await execute();
  return hasDoctors;
}

export async function fetchPharmacists(pharmacist) {
  const { uf, city, crf } = pharmacist;
  const BASE_URL = `https://site.cff.org.br/farmaceutico`;
  const PARAMS = `?uf=${uf.toUpperCase()}&cidade=${city.toUpperCase()}&categoria=farmaceutico&nome=${crf}&search=1`;

  async function execute() {
    const browser = await initBrowser();
    const page = await createPage(browser, BASE_URL + PARAMS);
    let hasPharmacists = false;

    try {
      await page.waitForSelector(
        "#buscaFarmaceutico > div > div > div > div > div.section.py-4.py-md-5 > div > div",
        { timeout: 10000 }
      );
      hasPharmacists = false;
    } catch (error) {
      hasPharmacists = true;
    }

    await browser.close();
    return hasPharmacists;
  }

  const hasPharmacists = await execute();
  return hasPharmacists;
}
