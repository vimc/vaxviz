import { Download, Locator, Page } from "@playwright/test";

export const doDownload = async (page: Page, downloadButton: Locator): Promise<Download> => {
  const downloadPromise = page.waitForEvent("download");
  await downloadButton.click();
  const download = await downloadPromise;

  // Wait for the download process to complete
  await download.path();

  return download;
};

export const readDownloadedFile = async (download: Download) => {
  const readStream = await download.createReadStream();
  let fileContents = "";
  readStream.on("readable", () => {
    let chunk: string;
    while (null !== (chunk = readStream.read())) {
      fileContents += chunk;
    }
  });
  await new Promise((resolve) => {
    readStream.on("end", resolve);
  });
  return fileContents;
};
