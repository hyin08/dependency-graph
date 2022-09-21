import axios from "axios";

function downloadUnpkg(packageName, version) {
    let url = `https://unpkg.com/${packageName}`;
    if (version) {
        url += `@${version}`;
    }
    url += "/package.json";
    return url;
    // return fetch(url).then((response) => response.json());
}

function downloadHttp(packageName, url) {
    const match = url.match(
        /^(git\+)?https?:\/\/(www\.)?github.com\/(?<owner>[\w.-]+)\/(?<name>[\w.-]+)/
    );
    if (!match) return Promise.resolve();
    const targetUrl = `https://api.github.com/repos/${match.groups.owner}/${match.groups.name}/contents/package.json`;
    return url;
    // return fetch(targetUrl).then((response) => response.json());
}

async function downloadVersions(packageName) {
    const url = `https://registry.npmjs.org/${packageName}`;
    return axios.get(url)
      .then(res => {
          if(res.data) {
              return {data: res.data.versions, error: null}
          }
      })
      .catch(error => {
          return {data: null, error: error.message}
      })
}

export {
    downloadUnpkg,
    downloadHttp,
    downloadVersions
}