<template>
    <div>
      <el-tree :data="data" ></el-tree>
    </div>
</template>
<script>
import { defineComponent, reactive, toRefs, watchEffect } from 'vue'
import { ElTree } from 'element-plus'

const defaultProps = {
  children: 'children',
  label: 'label'
}

export default defineComponent({
  components: {
    ElTree
  },
  props: {
      data: Array
  },
  setup(props) {
    const state = reactive({
        data: ''
    })
    watchEffect(() => {
        state.data = props.data
    })
    return { 
        ...toRefs(state)
    }
  }
})

</script>
<style scoped>
.read-the-docs {
  color: #888;
}
</style>
