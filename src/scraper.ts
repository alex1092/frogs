import { chromium } from "@playwright/test";
import * as fs from "node:fs";

async function sendFriendRequests() {
  const browser = await chromium.launchPersistentContext(
    "~/Applications/Arc.app",
    {
      headless: false,
    }
  );

  const page = await browser.newPage();

  try {
    const urls = fs
      .readFileSync("frog-urls.txt", "utf-8")
      .split("\n")
      .filter(Boolean);
    console.log(`Found ${urls.length} URLs to process`);

    for (const [index, url] of urls.entries()) {
      try {
        await page.goto(url);

        await page.waitForTimeout(1000);

        const frame = await page.frameLocator("iframe").first();

        const friendRequestButton = frame.getByRole("button", {
          name: "send FROG REQUEST",
        });

        await friendRequestButton.waitFor({ state: "visible" });

        await friendRequestButton.click();

        await page.waitForTimeout(1500);

        console.log(`Processed ${index + 1}/${urls.length}: ${url}`);
      } catch (error) {
        console.error(`Error processing ${url}:`, error);
      }
    }

    console.log("Finished processing all URLs");
  } catch (error) {
    console.error("Error occurred:", error);
  } finally {
    await browser.close();
  }
}

sendFriendRequests();
