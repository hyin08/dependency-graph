<script lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { defineComponent, ref, onMounted } from 'vue'
export default defineComponent({
  name: 'HomeView',
  setup() {
    const versionInfo = ref(null)
    const showVersionInfo = (version) => {
      versionInfo.value = version
      console.log(versionInfo.value);
    }

    return { 
      versionInfo,
      showVersionInfo
    }
  }

})
</script>

<template>
  <div class="common-layout">
    <el-container>
      <el-aside width="400px"
        ><nav>

          <PackageVersions @show-version-info="showVersionInfo" />
          <!-- <RouterLink to="/axios">Axios</RouterLink> -->
        </nav></el-aside
      >
    </el-container>
  </div>
</template>
