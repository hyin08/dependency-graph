<template>
  <div class="axios-container page-container">
    <div class="page-title">Npm Package Info Page</div>
    <div class="user-info-container">
      <el-card class="box-card">
        <template #header>
          <div class="card-header">
            <el-input
              v-model="input1"
              placeholder="Please input"
              @change="getPackageInfo"
            >
              <template #prepend>Npm：</template>
            </el-input>

            <el-button class="button" type="text" @click="getPackageInfo"
              >点击获取npm包信息
            </el-button>
          </div>
          <div class="box-card">
            <span></span>
            <el-button class="button" @click="extractTgz"
              >下载tgz文件
            </el-button>
          </div>

          <div class="card-header">
            <el-input v-model="git_url" placeholder="Please input git address">
              <template #prepend>git:</template>
            </el-input>
            <el-button class="button" @click="cloneGitLib2">Clone </el-button>
          </div>
        </template>
        <div class="info-list-box" v-loading="loading">
          <div class="text item" v-if="packageInfo?.name">
            name: {{ packageInfo?.name }}
          </div>
          <div class="text item" v-if="packageInfo?.version">
            version: {{ packageInfo?.version }}
          </div>
          <div class="text item" v-if="packageInfo?.dependencies">
            dependencies: {{ packageInfo?.dependencies }}
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, type Ref, onMounted } from 'vue'
import axios from '../utils/axios'
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
    const cache = new cacheDB(() => {})

    const fs = new FS('testfs')
    
    // 使用 wasm-git库获取
    const cloneGitLib = () => {
      worker.postMessage({
        command: 'clone',
        url: git_url.value,
      })
    }

    const getPackageInfo = () => {
      loading.value = true
      console.log('user input', input1.value)
      axios
        .get(input1.value + '/package.json')
        .then((response) => {
          console.log('response: ', response.data)
          packageInfo.value = response.data
          loading.value = false
        })
        .catch((error) => {
          loading.value = false
          console.error(error)
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
      // 写入cache
      cache.cacheModel('https://registry.npmjs.org/vue/-/vue-3.2.39.tgz')
      axios
        .get('https://registry.npmjs.org/vue/-/vue-3.2.39.tgz', {
          responseType: 'blob',
        })
        .then(async (response) => {
          console.log('response: ', response.data)
          const file = new window.File([response.data], 'vue-3.2.39.tgz', {
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
