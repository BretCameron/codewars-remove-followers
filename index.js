const puppeteer = require("puppeteer");
const login = require("./login.json");

(async () => {
  const browser = await puppeteer.launch({ headless: false });

  const page = await browser.newPage();

  await page.setViewport({
    width: 1080,
    height: 1080,
    deviceScaleFactor: 1
  });

  await page.goto("https://www.codewars.com/users/sign_in");

  await page.type("#user_email", login.EMAIL_ADDRESS);
  await page.type("#user_password", login.PASSWORD);

  await page.click('.btn[type="submit"');
  await page.waitFor(1000);

  const profileLink = await page.$("#header_profile_link");
  const url = await page.evaluate(profileLink => profileLink.href, profileLink);
  await profileLink.dispose();

  await page.goto(`${url}/following`, { waitUntil: "networkidle0" });
  await page.waitFor(1000);

  const viewFollowing = await page.$(
    'dd[title="View all users that you are following"'
  );

  const followerCount = await page.evaluate(
    viewFollowing => parseInt(viewFollowing.innerText.match(/\d+/)[0], 10),
    viewFollowing
  );

  await viewFollowing.dispose();

  let users;

  do {
    await page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
    await page.waitFor(500);

    users = await page.evaluate(() => {
      return [...document.querySelectorAll("tr a")].map(a => a.href);
    });
  } while (users.length < followerCount);

  for (let i = 0; i < users.length; i++) {
    await page.goto(users[i], { waitUntil: "networkidle0" });

    const toggle = await page.$("#toggle_relationship");
    const toggleText = await page.evaluate(toggle => toggle.innerText, toggle);
    await toggle.dispose();

    if (toggleText === "Unfollow") {
      await page.click("#toggle_relationship");
    }

    await page.waitFor(500);

    console.log(`Unfollowed user ${i + 1} of ${users.length}`);
  }

  await browser.close();
})();
