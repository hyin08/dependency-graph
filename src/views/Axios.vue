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
            <el-button class="button" @click="extractTgz"
              >下载tgz文件
            </el-button>
          </div>
          <input type="file" id="file" />
          <el-input
            v-model="git_url"
            placeholder="Please input git address"
          >
            <template #prepend>git:</template>
          </el-input>

          <el-button class="button" type="text" @click="cloneGitLib"
            >Clone
          </el-button>
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

    onMounted(() => {
      document.getElementById('file').addEventListener('change', async (e) => {
        const file = e.currentTarget.files[0]

        const archive = await Archive.open(file)
        let obj = await archive.extractFiles()

        console.log(obj)
      })
    })

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
          let obj = await archive.extractFiles()

          console.log(obj)

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
    }

    .box-card {
      width: 480px;
    }
  }
}
</style>
