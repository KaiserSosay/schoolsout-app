const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const url = 'https://www.thegrowingplace.school/school-calendar';
  const outputDir = path.join(process.env.HOME, 'Downloads', 'schoolsout-calendars');
  const screenshotPath = path.join(outputDir, 'the-growing-place-2025-2026.png');
  
  try {
    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle' });
    
    // Check for PDF download links
    const pdfLinks = await page.$$eval('a[href$=".pdf"], a[href*="pdf"]', links => 
      links.map(link => ({
        href: link.href,
        text: link.textContent.trim()
      }))
    );
    
    if (pdfLinks.length > 0) {
      console.log('Found PDF links:');
      pdfLinks.forEach((link, i) => console.log(`  ${i + 1}. ${link.text}: ${link.href}`));
      
      // Download the first PDF that looks like a calendar
      const calendarPdf = pdfLinks.find(link => 
        link.text.toLowerCase().includes('calendar') || 
        link.href.toLowerCase().includes('calendar')
      ) || pdfLinks[0];
      
      console.log(`Downloading PDF: ${calendarPdf.href}`);
      const pdfPath = path.join(outputDir, 'the-growing-place-2025-2026.pdf');
      
      const pdfPage = await browser.newPage();
      const response = await pdfPage.goto(calendarPdf.href);
      const buffer = await response.buffer();
      fs.writeFileSync(pdfPath, buffer);
      
      console.log(`PDF saved to: ${pdfPath}`);
      await pdfPage.close();
    } else {
      console.log('No PDF links found. Taking full-page screenshot...');
    }
    
    // Take screenshot regardless (in case PDF download fails or as backup)
    console.log('Taking full-page screenshot...');
    await page.screenshot({
      path: screenshotPath,
      fullPage: true
    });
    
    console.log(`Screenshot saved to: ${screenshotPath}`);
    
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
})();
