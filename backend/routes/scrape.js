const express = require("express");
const cheerio = require("cheerio");

const router = express.Router();

router.post("/", async (req, res) => {
  let { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  // Prepend protocol if missing
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "max-age=0",
        "Upgrade-Insecure-Requests": "1"
      },
      redirect: "follow",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      if (response.status === 403 || response.status === 503) {
        throw new Error(`The website (like Amazon/Google) blocked our automated scan. High-security sites require a professional scraping proxy.`);
      }
      throw new Error(`Failed to fetch URL (Status: ${response.status})`);
    }

    const html = await response.text();
    if (html.includes("To discuss automated access") || html.includes("api-services-support@amazon.com")) {
      throw new Error("Amazon blocked the scan. High-security sites often block automated tools. Try pasting the review text directly.");
    }
    const $ = cheerio.load(html);

    // Advanced extraction heuristic for Amazon and others
    const paragraphs = [];
    const selectors = [
      "span[data-hook='review-body']", 
      "div.reviewText", 
      "div.text_content", 
      "p", 
      "span.a-size-base.review-text"
    ];

    $(selectors.join(", ")).each((i, el) => {
      const text = $(el).text().trim();
      if (text.length > 25) {
        paragraphs.push(text);
      }
    });

    // If still empty, try to grab any large text block
    if (paragraphs.length === 0) {
      $("div, section").each((i, el) => {
        const text = $(el).clone().children("script, style").remove().end().text().trim();
        if (text.length > 100 && text.length < 1000) {
           paragraphs.push(text);
        }
      });
    }

    const combinedText = paragraphs.slice(0, 10).join("\n\n"); // Just top 10 segments

    if (!combinedText) {
      return res.status(404).json({ error: "Could not find readable text/reviews on this page." });
    }

    // Limit to reasonable length to avoid overwhelming the frontend model
    const truncatedText = combinedText.length > 50000 ? combinedText.slice(0, 50000) : combinedText;

    res.json({ text: truncatedText });
  } catch (error) {
    console.error("Scraping Error:", error.message);
    res.status(500).json({ error: "Failed to scrape the URL. " + error.message });
  }
});

module.exports = router;
