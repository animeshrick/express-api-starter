const CommonHelper = require('../helper/common.helper');
const redisHelper = require('../helper/redis.helper');

exports.getUserEvents = async (req, res, next) => {
  try {
    const user_name = req.params.username;
    const url = `https://api.github.com/users/${user_name}/events`;
    const user_events = await CommonHelper.getUserEventsFromGitHub(url);

    if (!user_events || user_events.length === 0) {
      return res.status(404).json({ success: false, message: 'No events found for this user.' });
    }

    const eventCount = {};
    const finalMap = new Map();

    for (const value of user_events) {
      const type = value.type.toLowerCase();
      const repo_name = value.repo?.name?.toLowerCase();
      const branch = value.payload?.ref?.split("/")?.pop();
      let message = "";

      // increase counter by type
      eventCount[type] = (eventCount[type] || 0) + 1;
      const count = eventCount[type];

      switch (type) {

        case "pushevent":
          if (count > 1) {
            message = `Pushed code to ${repo_name} ${count} times`;
          } else {
            message = `Pushed code to ${repo_name} (branch: ${branch})`;
          }
          break;

        case "watchevent":
          if (count > 1) {
            message = `Starred repository ${repo_name} (${count} times)`;
          } else {
            message = `Starred repository ${repo_name}`;
          }
          break;

        case "publicevent":
          if (count > 1) {
            message = `Made repository ${repo_name} public (${count} times)`;
          } else {
            message = `Made repository ${repo_name} public`;
          }
          break;

        case "issuesevent":
          if (count > 1) {
            message = `Found issue in ${repo_name} (${count} times)`;
          } else {
            message = `Found issue in ${repo_name} (branch: ${branch})`;
          }
          break;

        default:
          message = `Performed ${type} on ${repo_name}`;
          break;
      }

      // ⭐ unique key → eventType + repo name
      const key = `${type}|${repo_name}`;
      // console.log("key:", key, " message:", message);

      // ⭐ only keep the final message (overwrite older)
      finalMap.set(key, message);
    }

    // convert map values to final array
    const finalMessages = Array.from(finalMap.values());
    const name = `github:useraction:${user_name}`
    await redisHelper.set(name, finalMessages, 86400); // 1 day expiry


    res.status(200).json({ success: true, message: finalMessages });

  } catch (err) {
    // console.log("user_events err:", err);
    next(err);
  }
};
