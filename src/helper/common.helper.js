const axios = require('axios');

class CommonHelper {
    static getUserEventsFromGitHub(urlStr) {
        return new Promise((resolve, reject) => {
            axios
                .get(urlStr)
                .then(function (response) {
                    // console.log('Api call response', response);
                    if (response.status && response.status == 200) {
                        resolve(response.data);
                    } else {
                        resolve(null);
                    }
                })
                .catch(function (error) {
                    // console.log('Api call catch', error);
                    resolve(null);
                });
        });
    }

    static async getUserEventsFromGitHub2(urlStr) {
        try {
            const response = await axios.get(urlStr);

            // console.log("API call response", response.data);

            return response.status === 200 ? response.data : null;

        } catch (error) {
            // console.log("API call catch", error.message);
            return null;
        }
    }
}

module.exports = CommonHelper;