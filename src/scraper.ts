import { chromium, BrowserContext } from "@playwright/test";
import * as fs from "node:fs";

async function processSingleUrl(
  url: string,
  browserContext: BrowserContext,
  urlIndex: number,
  totalUrls: number
): Promise<{ url: string; success: boolean }> {
  const page = await browserContext.newPage();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded" });

    await page.waitForTimeout(5000);

    const frame = await page.frameLocator("iframe").first();
    const friendRequestButton = frame.getByRole("button", {
      name: "send FROG REQUEST",
    });

    await friendRequestButton.waitFor({
      state: "visible",
      timeout: 20000,
    });

    await friendRequestButton.click();

    await page.waitForTimeout(5000);

    console.log(`✅ Success ${urlIndex + 1}/${totalUrls}: ${url}`);
    return { url, success: true };
  } catch (error) {
    console.error(`❌ Failed ${urlIndex + 1}/${totalUrls}: ${url}`);
    console.error(`Error details:`, error);
    return { url, success: false };
  } finally {
    await page.close();
  }
}

async function sendFriendRequests() {
  const browser = await chromium.launchPersistentContext(
    "~/Applications/Arc.app",
    {
      headless: false,
    }
  );

  const results = {
    successful: [] as string[],
    failed: [] as string[],
  };

  try {
    const urls = fs
      .readFileSync("frog-urls.txt", "utf-8")
      .split("\n")
      .filter(Boolean);
    console.log(`Found ${urls.length} URLs to process`);

    const batchSize = 5;
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map((url, index) =>
          processSingleUrl(url, browser, i + index, urls.length)
        )
      );

      // Track results
      batchResults.forEach(({ url, success }) => {
        if (success) {
          results.successful.push(url);
        } else {
          results.failed.push(url);
        }
      });
    }

    // Final summary
    console.log("\n=== Final Summary ===");
    console.log(`✅ Successfully processed: ${results.successful.length} URLs`);
    console.log(`❌ Failed: ${results.failed.length} URLs`);

    if (results.failed.length > 0) {
      console.log("\nFailed URLs:");
      results.failed.forEach((url) => console.log(`❌ ${url}`));

      // Optionally save failed URLs to a file for retry
      fs.writeFileSync("failed-urls.txt", results.failed.join("\n"));
      console.log("\nFailed URLs have been saved to failed-urls.txt");
    }
  } catch (error) {
    console.error("Error occurred:", error);
  } finally {
    await browser.close();
  }
}

sendFriendRequests();
