<template>
  <div class="container">
    <div class="card-header">
      <el-input v-model="input" placeholder="Please input">
        <template #prepend>Npm：</template>
      </el-input>

      <el-button class="button" type="text" @click="getVersionsInfo"
        >点击获取npm包版本
      </el-button>
    </div>

    <div class="info-list-box" v-loading="loading">
      <div class="text item">Versions:</div>
      <ul v-if="versionsInfo">
        <li v-for="(value, key) in versionsInfo" :key="key" @click="$emit('showVersionInfo', value)">
          {{ key }}
        </li>
      </ul>

      <span v-else class="red">Error.</span>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue'
import axios from '../utils/axios'
import { downloadVersions } from '../utils/download'

export default defineComponent({
  name: 'PackageVersions',
  setup() {
      const input = ref('')
      const versionsInfo = ref({})
      const err = ref(null)
      const loading = ref(false)


      const getVersionsInfo = async () => {
          loading.value = true
          const {data, error} = await downloadVersions(input.value)
          loading.value = false
          versionsInfo.value = data
          err.value = error
      }

      return {
      input,
      versionsInfo,
      loading,
      getVersionsInfo
    }
  }
})
</script>

<style scoped lang="scss">
  .container {
      padding: 1rem
  }
  .red {
      color: red
  }
  li {
      cursor: pointer
  }
</style>