<template>
  <div>
    <el-container>
      <el-aside width="400px"
        ><nav>
          <PackageVersions @show-version-info="showVersionInfo" />
          <!-- <RouterLink to="/axios">Axios</RouterLink> -->
        </nav></el-aside
      >
      <el-main>
        <div v-if="versionInfo" class="axios-container page-container">
          <div class="user-info-container">
            <el-card class="box-card">
              <template #header>
                <div class="card-title">{{versionInfo?.name + '@' + versionInfo?.version}}</div>
                <div class="card-header">
                  <el-button class="button" @click="getPackageInfo"
                    >生成dependency graph
                  </el-button>

                  <el-button class="button" @click="extractTgz"
                    >下载tgz文件
                  </el-button>
                </div>

                <div class="card-header">
                  <el-input
                    v-model="git_url"
                    placeholder="Please input git address"
                  >
                    <template #prepend>git:</template>
                  </el-input>
                  <el-button class="button" @click="cloneGitLib2"
                    >Clone
                  </el-button>
                </div>
              </template>
              <div class="info-list-box" v-loading="loading">
                <div class="text item">dependencies:</div>
                <!-- <ul>
                  <li v-for="(value, key) in packageInfo" :key="key">
                    {{ key }}: {{ value }}
                  </li>
                </ul> -->
                <DependencyTree :data="treeData"/>
              </div>
            </el-card>
          </div>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, type Ref, onMounted } from 'vue'
import axios from '../utils/axios'
import { downloadUnpkg, downloadHttp } from '../utils/download'
import { formatDependencyMap } from '../utils/data-formatter'
import cacheDB from '../utils/cacheFile'

import { Archive } from 'libarchive.js/main.js'

// import { getRemoteInfo } from 'isomorphic-git'
// import http from 'isomorphic-git/http/web'
import http from 'https://unpkg.com/isomorphic-git@beta/http/web/index.js'
import FS from '@isomorphic-git/lightning-fs'
// const fs = new LightningFS('fs')

// const dir = '/test-clone'

Archive.init({
  workerUrl: './dist/worker-bundle.js',
})

// git web worker init
const worker = new Worker('dist/libgit2_webworker.js')

worker.onmessage = (msg) => {
  console.log('git worker msg:', msg.data)
}

export default defineComponent({
  name: 'AxiosPage',

  setup() {
    const input1 = ref('')
    const git_url = ref('https://wasm-git.petersalomonsen.com/test')
    const packageInfo: Ref = ref(null)
    const loading = ref(false)
    const versionInfo = ref(null)
    const treeData = ref([]);
    const showVersionInfo = (version) => {
      versionInfo.value = version
      packageInfo.value = null
      treeData.value = []
      console.log(versionInfo.value);
    }

    const cache = new cacheDB(() => {})

    const fs = new FS('testfs')
    
    // 使用 wasm-git库获取
    const cloneGitLib = () => {
      worker.postMessage({
        command: 'clone',
        url: git_url.value,
      })
    }

    // 使用 isomorphic-git 库获取
    const cloneGitLib2 = async () => {
      // console.log(`Using isomorphic-git version: ${git.version()}`)

      // window.git
      //   .getRemoteInfo({
      //     http,
      //     url: git_url.value,
      //   })
      //   .then((data) => {
      //     if (data && data.refs && data.refs.heads) {
      //       console.log('List of remote branches')
      //       console.log(Object.keys(data.refs.heads))
      //     }
      //   })

      var s = git_url.value      
      const dir = s.substr(s.lastIndexOf('\/'), s.length-s.lastIndexOf('\/')).replaceAll('-', '_')
      console.log("url:", git_url.value, "proj=", dir)
      // const dir2='/empty_react_project'   
      await window.git
        .clone({
          fs,
          http,
          dir,
          // url: 'https://github.com/isomorphic-git/lightning-fs',
          url: git_url.value,
          corsProxy: 'https://cors.isomorphic-git.org',
        })
        .then(console.log)

      fs.readdir(dir, (err, files) => {
        if (err) console.log(err)
        else {
          console.log('\nCurrent directory filenames:')
          File.forEach((file) => {
            console.log(file)
          })
        }
      })
      fs.readFile(`${dir}/package.json`, 'utf8', (err, data) => {
        if (err) console.log(err)
        else {
          console.log('\nCurrent file:')
          console.log(data)
        }
      })
    }

    const downloadFile = () => {
      loading.value = true
      console.log('user input', input1.value)
      // 写入cache
      cache.cacheModel('https://registry.npmjs.org/vue/-/vue-3.2.39.tgz')
      axios
        .get('https://registry.npmjs.org/vue/-/vue-3.2.39.tgz', {
          responseType: 'blob',
        })
        .then((response) => {
          console.log('response: ', response.data)
          // Let's create a link in the document that we'll
          // programmatically 'click'.
          const link = document.createElement('a')
          // Tell the browser to associate the response data to
          // the URL of the link we created above.
          link.href = window.URL.createObjectURL(new Blob([response.data]))

          // Tell the browser to download, not render, the file.
          link.setAttribute('download', 'vue-3.2.39.tgz')

          // Place the link in the DOM.
          document.body.appendChild(link)

          // Make the magic happen!
          link.click()
          loading.value = false
        })
        .catch((error) => {
          loading.value = false
          console.error(error)
        })
    }

    const extractTgz = () => {
      loading.value = true
      let tgz = versionInfo.value.dist.tarball

      // 写入cache
      cache.cacheModel(tgz)
      axios
        .get(tgz, {
          responseType: 'blob',
        })
        .then(async (response) => {
          console.log('response: ', response.data)
          const file = new window.File([response.data], tgz.split('/').at(-1), {
            type: 'application/x-compressed',
          })

          const archive = await Archive.open(file)
          // let obj = await archive.extractFiles()
          // console.log(obj)

          const filesObj = await archive.getFilesObject()
          const package_file = await filesObj['package']['package.json']
          console.log(package_file)
          const ex_file = await package_file.extract()
          console.log(ex_file)
          const package_info = await ex_file.text()
          console.log(package_info)

          loading.value = false
        })
        .catch((error) => {
          loading.value = false
          console.error(error)
        })
    }
    
     // 存储下载的packages
    let packages = {};

    // 存储正在进行的requests
    let requests = new Set();
    
    const getPackageInfo = () => {
      debugger;
      packages = {};
      requests = new Set();

      loading.value = true
      console.log('user input', input1.value)
      run({ packageName: versionInfo.value.name, version: versionInfo.value.version })
      // axios
      //   .get(input1.value + '/package.json')
      //   .then((response) => {
      //     console.log('response: ', response.data)
      //     packageInfo.value = response.data
      //     loading.value = false
      //   })
      //   .catch((error) => {
      //     loading.value = false
      //     console.error(error)
      //   })
    }

    const run = async (pkg) => {
      // 如果已经找到，或者正在查找，直接返回
      const key = generateKey(pkg)
      if (packages[key] || requests.has(key)) {
        return;
      }
      requests.add(key);
      // TODO: 确定是用 downloadHttp 还是 downloadUnpkg
      const type = extractType(pkg);
      if(type === 'https') {
        axios.get(downloadHttp(pkg.packageName, pkg.version))
          .then((response) => {
            if (response.data) {
              const packageJson = JSON.parse(atob(response.data.content));
              next(pkg, packageJson);
            }
          })
          .catch((error) => {
            loading.value = false
            packageInfo.value = null
            console.error(error)
          });
      } else if(type === 'semver') {
        axios.get(downloadUnpkg(pkg.packageName, pkg.version))
          .then((response) => {
            if (response.data) {
              const packageJson = response.data;
              next(pkg, packageJson);
            }
          })
          .catch((error) => {
              loading.value = false
              packageInfo.value = null
              console.error(error)
          });
      }
    }

    const extractType = pkg => {
      if(pkg.version?.match(/(^https|^git|^git\+https|^git\+ssh)\:\/\//)) {
        return 'https'
      } else {
        return 'semver'
      }
    }

    const next = (pkg, packageJson) => {
      const key = generateKey(pkg);
      requests.delete(key);
      packages[key] = formatData(packageJson);
      // 递归查找
      packageJson.dependencies &&
        Object.keys(packageJson.dependencies).map((dependency) => {
          run({ packageName: dependency, version: packageJson.dependencies[dependency] });
        });
      if (requests.size === 0) {
        loading.value = false
        packageInfo.value = packages
        treeData.value = formatDependencyMap(packages)
        console.log('treeData: ', treeData.value);
        console.log(packages)
      }
    }

    const formatData = (data) => {
      const { version, dependencies } = data;
      return { version, dependencies };
    }

    const generateKey = pkg => {
      return pkg.packageName + (pkg.version ? `@${pkg.version}` : '')
    }

    return {
      input1,
      git_url,
      packageInfo,
      loading,
      getPackageInfo,
      downloadFile,
      extractTgz,
      cloneGitLib,
      cloneGitLib2,
      versionInfo,
      showVersionInfo,
      treeData,
    }
  },
})
</script>

<style scoped lang="scss">
.axios-container {
  .user-info-container {
    display: 'flex';
    justify-content: 'center';
    width: 100%;

    .info-list-box {
      padding: 10px;

      .text {
        font-size: 14px;
      }

      .item {
        margin-bottom: 18px;
      }
    }

    .card-title {
      font-size: 20px;
      font-weight: bold;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      margin-top: 20px;
    }

    .box-card {
      width: 480px;
    }
  }
}
</style>
